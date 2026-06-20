import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateAITeam } from '@/engine/ai-team-generator';
import { BattleEngine } from '@/engine/battle-engine';
import { unlockAchievements } from '@/engine/achievements';
import { ArenaTier } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deckId, arenaTier = 'BRONZE' } = body;

    if (!deckId) {
      return NextResponse.json({ success: false, error: 'deckId is required' }, { status: 400 });
    }

    // 1. Fetch player deck
    const deck = await db.deck.findUnique({
      where: { id: deckId },
      include: {
        user: true,
        deckCards: {
          include: { card: true },
          orderBy: { slotPosition: 'asc' }
        }
      }
    });

    if (!deck) {
      return NextResponse.json({ success: false, error: 'Deck not found' }, { status: 404 });
    }

    const playerCards = deck.deckCards.map(dc => dc.card);

    // 2. Matchmaking: ELO band + win/loss-streak adjustment.
    const playerOvrAvg = Math.floor(playerCards.reduce((sum, c) => sum + c.ovr, 0) / playerCards.length);
    const elo = deck.user.eloRating;

    // Pick the candidate tier from the player's strength so the pool matches.
    const matchTier: ArenaTier =
      playerOvrAvg >= 85 ? 'LEGEND' : playerOvrAvg >= 70 ? 'GOLD' : playerOvrAvg >= 55 ? 'SILVER' : 'BRONZE';

    // Current win/loss streak from the last few battles (most recent first).
    const recent = await db.battle.findMany({
      where: { userId: deck.userId },
      orderBy: { startedAt: 'desc' },
      take: 6,
      select: { result: true },
    });
    let streak = 0; // positive = win streak, negative = loss streak
    for (const b of recent) {
      if (b.result === 'WIN') { if (streak >= 0) streak++; else break; }
      else if (b.result === 'LOSS') { if (streak <= 0) streak--; else break; }
      else break;
    }
    // Win streak -> tougher foes; loss streak -> easier. Capped at +/-8 OVR.
    const streakAdj = Math.max(-8, Math.min(8, streak * 2));
    const variance = Math.floor(Math.random() * 5) - 2; // +/-2 jitter
    const targetOvr = Math.max(40, Math.min(99, playerOvrAvg + streakAdj + variance));
    // Tighter matchmaking at higher ELO (skilled players get fairer fights).
    const band = elo >= 1900 ? 3 : elo >= 1300 ? 4 : 6;

    const aiTeamEntries = await generateAITeam(matchTier, {
      excludeUserId: deck.userId,
      excludeCardIds: playerCards.map((c) => c.id),
      targetOvr,
      band,
    });
    const aiCards = aiTeamEntries.map((e) => e.card);

    // 3. Simulate the battle (engine reports damage + MVP directly).
    const engine = new BattleEngine(playerCards, aiCards);
    const finalState = engine.simulateBattle();
    const { playerDamageDealt, playerDamageTaken, mvp, result, turn } = finalState;

    // 4. ELO change scales with arena tier (plan §4.10).
    const baseEloChange = arenaTier === 'LEGEND' ? 30 : arenaTier === 'GOLD' ? 25 : arenaTier === 'SILVER' ? 20 : 15;
    const lossPenalty = Math.max(10, baseEloChange - 2); // Harsh penalty for loss
    const eloChange = result === 'WIN' ? baseEloChange : result === 'LOSS' ? -lossPenalty : 5;

    // 5. Persist the battle + log.
    const battle = await db.battle.create({
      data: {
        userId: deck.userId,
        deckId: deck.id,
        arenaTier: arenaTier as ArenaTier,
        result,
        turns: turn,
        playerDamageDealt,
        playerDamageTaken,
        eloChange,
        mvpCardId: mvp?.id ?? null,
        aiTeam: aiCards,
        battleSummary: { mvp, playerDamageDealt, playerDamageTaken, result, turns: turn },
        endedAt: new Date(),
        logs: {
          create: finalState.logs.map((log, i) => ({
            turnNumber: log.turnNumber,
            sequence: i,
            actorName: log.actorName,
            actionType: log.actionType,
            targetName: log.targetName,
            damage: log.damage,
            isCritical: log.isCritical,
            healing: log.healing,
            message: log.message
          }))
        }
      },
      include: { logs: { orderBy: { sequence: 'asc' } } }
    });

    // 6. Update the player's battle record + ELO.
    await db.user.update({
      where: { id: deck.userId },
      data: {
        totalBattles: { increment: 1 },
        battlesWon: { increment: result === 'WIN' ? 1 : 0 },
        battlesLost: { increment: result === 'LOSS' ? 1 : 0 },
        eloRating: { increment: eloChange },
      },
    });

    // 7. Unlock achievements (perfect = won without losing a card).
    const playerNames = new Set(playerCards.map((c) => c.name));
    const lostACard = finalState.logs.some((l) => l.actionType === 'DEFEATED' && playerNames.has(l.actorName));
    const newAchievements = await unlockAchievements(deck.userId, {
      result,
      arenaTier: arenaTier as string,
      perfect: result === 'WIN' && !lostACard,
    });

    // playerTeam is returned so the battle screen can render both squads.
    return NextResponse.json({ 
      success: true, 
      battle, 
      mvp, 
      playerTeam: playerCards, 
      aiTeam: aiCards, 
      newAchievements,
      eloRating: deck.user.eloRating + eloChange,
      totalBattles: deck.user.totalBattles + 1
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  
  if (!wallet) return NextResponse.json({ success: false, error: 'Wallet required' }, { status: 400 });

  try {
    const user = await db.user.findUnique({ where: { walletAddress: wallet } });
    if (!user) return NextResponse.json({ success: true, battles: [] });

    const battles = await db.battle.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: 'desc' },
      take: 20
    });

    return NextResponse.json({ success: true, battles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

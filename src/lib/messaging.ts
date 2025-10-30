import { prisma } from '@/lib/prisma'

/**
 * Sendet eine automatische System-Nachricht zwischen zwei Usern
 * Findet oder erstellt eine Konversation und fügt die Nachricht hinzu
 * Idempotent und race-condition-safe durch Verwendung von Transaktionen
 */
export async function sendSystemMessage(params: {
  fromUserId: string
  toUserId: string
  text: string
}): Promise<void> {
  const { fromUserId, toUserId, text } = params

  // Sortiere User-IDs für konsistente Konversations-Speicherung
  const [user1Id, user2Id] = [fromUserId, toUserId].sort()

  // Verwende eine Transaktion, um Race Conditions zu vermeiden
  await prisma.$transaction(async (tx) => {
    // Finde oder erstelle Konversation (upsert ist idempotent)
    const conversation = await tx.conversation.upsert({
      where: {
        user1Id_user2Id: {
          user1Id,
          user2Id,
        },
      },
      update: {
        updatedAt: new Date(),
      },
      create: {
        user1Id,
        user2Id,
      },
    })

    // Erstelle Chat-Nachricht
    await tx.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: fromUserId,
        text,
      },
    })
  })
}

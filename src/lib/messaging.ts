import { prisma } from '@/lib/prisma'

/**
 * Sendet eine automatische System-Nachricht zwischen zwei Usern
 * Findet oder erstellt eine Konversation und fügt die Nachricht hinzu
 */
export async function sendSystemMessage(params: {
  fromUserId: string
  toUserId: string
  text: string
}): Promise<void> {
  const { fromUserId, toUserId, text } = params

  // Sortiere User-IDs für konsistente Konversations-Speicherung
  const [user1Id, user2Id] = [fromUserId, toUserId].sort()

  // Finde oder erstelle Konversation
  let conversation = await prisma.conversation.findUnique({
    where: {
      user1Id_user2Id: {
        user1Id,
        user2Id,
      },
    },
  })

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        user1Id,
        user2Id,
      },
    })
  }

  // Erstelle Chat-Nachricht
  await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: fromUserId,
      text,
    },
  })

  // Update Conversation updatedAt
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  })
}

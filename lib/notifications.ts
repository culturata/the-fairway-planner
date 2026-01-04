import { prisma } from "@/lib/prisma";

export enum NotificationType {
  MESSAGE = "MESSAGE",
  SCORE_UPDATE = "SCORE_UPDATE",
  PAYMENT = "PAYMENT",
  ANNOUNCEMENT = "ANNOUNCEMENT",
  COMPETITION = "COMPETITION",
  ROUND_CREATED = "ROUND_CREATED",
  RSVP_UPDATE = "RSVP_UPDATE",
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  actionUrl?: string;
  data?: any;
}

/**
 * Create a notification for a user
 */
export async function createNotification(input: CreateNotificationInput) {
  return await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl,
      data: input.data || {},
    },
  });
}

/**
 * Create notifications for multiple users
 */
export async function createNotifications(inputs: CreateNotificationInput[]) {
  return await prisma.notification.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl,
      data: input.data || {},
    })),
  });
}

/**
 * Notify all event members
 */
export async function notifyEventMembers({
  eventId,
  type,
  title,
  message,
  actionUrl,
  data,
}: {
  eventId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  actionUrl?: string;
  data?: any;
}) {
  const eventMembers = await prisma.eventMember.findMany({
    where: { eventId },
    include: { userProfile: true },
  });

  const notifications = eventMembers.map((member) => ({
    userId: member.userProfile.id,
    type,
    title,
    message,
    actionUrl,
    data,
  }));

  return await createNotifications(notifications);
}

/**
 * Notify when scorecard is submitted
 */
export async function notifyScoreSubmitted(scorecardId: string) {
  const scorecard = await prisma.scorecard.findUnique({
    where: { id: scorecardId },
    include: {
      eventMember: {
        include: {
          userProfile: true,
          event: true,
        },
      },
      round: true,
    },
  });

  if (!scorecard) return;

  const playerName =
    scorecard.eventMember.userProfile.name ||
    scorecard.eventMember.userProfile.email ||
    "A player";

  await notifyEventMembers({
    eventId: scorecard.eventMember.eventId,
    type: NotificationType.SCORE_UPDATE,
    title: "Score Submitted",
    message: `${playerName} has submitted their score for ${scorecard.round.courseName}`,
    actionUrl: `/r/${scorecard.roundId}`,
    data: {
      scorecardId,
      roundId: scorecard.roundId,
      eventMemberId: scorecard.eventMemberId,
    },
  });
}

/**
 * Notify when new announcement is posted
 */
export async function notifyAnnouncement(announcementId: string) {
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    include: { event: true },
  });

  if (!announcement) return;

  await notifyEventMembers({
    eventId: announcement.eventId,
    type: NotificationType.ANNOUNCEMENT,
    title: announcement.title || "New Announcement",
    message: announcement.message,
    actionUrl: `/e/${announcement.eventId}`,
    data: {
      announcementId,
      eventId: announcement.eventId,
    },
  });
}

/**
 * Notify when new round is created
 */
export async function notifyRoundCreated(roundId: string) {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: { event: true },
  });

  if (!round) return;

  await notifyEventMembers({
    eventId: round.eventId,
    type: NotificationType.ROUND_CREATED,
    title: "New Round Scheduled",
    message: `A round at ${round.courseName} has been scheduled for ${new Date(
      round.startsAt
    ).toLocaleDateString()}`,
    actionUrl: `/r/${roundId}`,
    data: {
      roundId,
      eventId: round.eventId,
    },
  });
}

/**
 * Notify when payment is received
 */
export async function notifyPaymentReceived(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      userProfile: true,
      eventCostItem: {
        include: { event: true },
      },
    },
  });

  if (!payment) return;

  await createNotification({
    userId: payment.userProfile.id,
    type: NotificationType.PAYMENT,
    title: "Payment Received",
    message: `Your payment of $${(payment.amountCents / 100).toFixed(2)} for ${
      payment.eventCostItem.name
    } has been received.`,
    actionUrl: `/e/${payment.eventCostItem.eventId}/payments`,
    data: {
      paymentId,
      eventId: payment.eventCostItem.eventId,
    },
  });
}

/**
 * Notify when competition results are calculated
 */
export async function notifyCompetitionResults(competitionId: string) {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: { event: true },
  });

  if (!competition) return;

  await notifyEventMembers({
    eventId: competition.eventId,
    type: NotificationType.COMPETITION,
    title: `${competition.name} Results`,
    message: `Results for ${competition.name} are now available!`,
    actionUrl: `/e/${competition.eventId}/competitions/${competitionId}`,
    data: {
      competitionId,
      eventId: competition.eventId,
    },
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string) {
  return await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return await prisma.notification.count({
    where: { userId, read: false },
  });
}

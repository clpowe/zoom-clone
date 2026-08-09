import type { Room } from "./rooms";

type CloudflareMeeting = {
  id: string;
};

type CreateCloudflareMeetingInput = {
  title: string;
};

type PersistRoomInput = {
  title: string;
  cloudflareMeetingId: string;
};

type CreateRoomForMeetingInput = {
  title: string;
  persistRoom: (input: PersistRoomInput) => Promise<Room>;
  createCloudflareMeeting: (input: CreateCloudflareMeetingInput) => Promise<CloudflareMeeting>;
  deleteCloudflareMeeting?: (meetingId: string) => Promise<void>;
};

function createRoomError(statusCode: number, statusMessage: string) {
  return Object.assign(new Error(statusMessage), {
    statusCode,
    statusMessage,
  });
}

export async function createRoomForMeeting(input: CreateRoomForMeetingInput): Promise<Room> {
  const title = input.title.trim();

  if (!title) {
    throw createRoomError(400, "Room title is required");
  }

  const meeting = await input.createCloudflareMeeting({ title });

  try {
    return await input.persistRoom({
      title,
      cloudflareMeetingId: meeting.id,
    });
  } catch (error) {
    if (input.deleteCloudflareMeeting) {
      await input.deleteCloudflareMeeting(meeting.id).catch(() => undefined);
    }

    throw error;
  }
}

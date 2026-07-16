import { createRoom, type Room } from "./rooms";

type CloudflareMeeting = {
  id: string;
};

type CreateCloudflareMeetingInput = {
  title: string;
};

type CreateRoomForMeetingInput = {
  title: string;
  persistRoom?: (input: PersistRoomInput) => Promise<Room>;
  createCloudflareMeeting: (input: CreateCloudflareMeetingInput) => Promise<CloudflareMeeting>;
  deleteCloudflareMeeting?: (meetingId: string) => Promise<void>;
};

type PersistRoomInput = {
  title: string;
  cloudflareMeetingId: string;
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

  const roomInput = {
    title,
    cloudflareMeetingId: meeting.id,
  };

  if (input.persistRoom) {
    try {
      return await input.persistRoom(roomInput);
    } catch (error) {
      if (input.deleteCloudflareMeeting) {
        await input.deleteCloudflareMeeting(meeting.id).catch(() => undefined);
      }
      throw error;
    }
  }

  return createRoom(roomInput);
}

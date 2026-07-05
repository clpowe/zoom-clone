import { createRoom, type Room } from "./rooms";

type CloudflareMeeting = {
  id: string;
};

type CreateCloudflareMeetingInput = {
  title: string;
};

type CreateRoomForMeetingInput = {
  title: string;
  createCloudflareMeeting: (input: CreateCloudflareMeetingInput) => Promise<CloudflareMeeting>;
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

  return createRoom({
    title,
    cloudflareMeetingId: meeting.id,
  });
}

export default defineEventHandler(async (event) => {
  const roomId = getRouterParam(event, "id");

  if (!roomId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing room ID",
    });
  }

  return {
    data: getRoomByIdOrThrow(roomId),
  };
});

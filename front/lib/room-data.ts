export type Room = {
  roomNo: string;
  type: string;
  beds: number;
  price: number;
};

// Keep the frontend's temporary fallback data aligned with the local Flyway seed.
// This will be replaced by GET /api/v1/rooms during frontend integration.
export const defaultRooms: Room[] = [
  { roomNo: "101", type: "Single", beds: 1, price: 22_500 },
  { roomNo: "102", type: "Twin", beds: 2, price: 27_500 },
  { roomNo: "103", type: "Twin", beds: 2, price: 27_500 },
  { roomNo: "104", type: "Triple", beds: 3, price: 20_000 },
  { roomNo: "105", type: "Twin", beds: 2, price: 25_000 },
];

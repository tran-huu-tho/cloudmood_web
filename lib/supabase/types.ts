export type UserRow = {
  id: number;
  fullName: string | null;
  email: string | null;
  password: string | null;
  avatar: string | null;
  role: boolean | null;
  createdAt: string | null;
  isBlocked?: boolean | null;
};

export type Category = {
  id: number;
  name: string | null;
};

export type Place = {
  id: number;
  name: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  price: string | null;
  openTime: string | null;
  closeTime: string | null;
  categoryId: number | null;
  image: string | null;
  rating: number | null;
  userRatingCount: number | null;
  externalId: string | null;
  phone: string | null;
  website: string | null;
  priceLevel: string | null;
  subCategories?: string[] | null;
  lastSyncedAt: string | null;
};

export type Review = {
  id: number;
  rating: number | null;
  comment: string | null;
  userId: number | null;
  placeId: number | null;
};

export type Itinerary = {
  id: number;
  title: string | null;
  startDate: string | null;
  days: number | null;
  budget: number | null;
  userId: number | null;
  destination: string | null;
  companion: string | null;
  pace: string | null;
  categories: string[] | null;
  amenities: string[] | null;
  dayConfigs: any | null;
};

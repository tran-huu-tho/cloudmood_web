export type UserRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  password: string | null;
  avatar: string | null;
  role: boolean | null;
  createdAt: string | null;
};

export type Category = {
  id: string;
  name: string | null;
  icon: string | null;
};

export type Place = {
  id: string;
  name: string | null;
  description: string | null;
  latitude: string | null;
  longitude: string | null;
  address: string | null;
  price: string | null;
  openTime: string | null;
  closeTime: string | null;
  categoryId: string | null;
  image: string | null;
};

export type Review = {
  id: string;
  rating: string | null;
  comment: string | null;
  userId: string | null;
  placeId: string | null;
};

export type Itinerary = {
  id: string;
  title: string | null;
  startDate: string | null;
  days: string | null;
  budget: string | null;
  userId: string | null;
};

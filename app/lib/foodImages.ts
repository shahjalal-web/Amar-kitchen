// খাবারের ছবি: নতুন ডেটায় images[] (প্রথমটা প্রধান), পুরনো ডেটায় শুধু image
export interface FoodImage { url: string; credit?: string }

export interface FoodLike {
  _id?: string;
  name: string;
  category?: string;
  image?: string;
  imageCredit?: string;
  images?: FoodImage[];
  source?: 'admin' | 'kitchen';
}

export const foodImages = (food: FoodLike): FoodImage[] => {
  if (food.images?.length) return food.images;
  return food.image ? [{ url: food.image, credit: food.imageCredit }] : [];
};

export const coverImage = (food: FoodLike) => foodImages(food)[0]?.url;

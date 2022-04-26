export type ClerkUser = {
  id: string;
  profile_image_url: string;
  first_name: string;
  last_name: string;
  email_addresses: {
    email_address: string;
    verification: {
      status: string;
      strategy: string;
    };
  }[];
  phone_numbers?: {
    phone_number: string;
  }[];
};

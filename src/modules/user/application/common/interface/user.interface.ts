export interface UserInterface {
  id: string,
  email: string,
  displayName: string,
  picture: string | null,
  role: string,
  isVerified: boolean,
  isTwoFactorEnabled: boolean,
  method: string,
  createdAt: Date,
  updatedAt: Date
}
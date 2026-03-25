import jwt from 'jsonwebtoken';

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET as string, {
    expiresIn: '30d',
  });
};

export const verifyToken = (token: string): { userId: string; role: string } => {
  return jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string; role: string };
};

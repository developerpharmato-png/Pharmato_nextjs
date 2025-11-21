import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export function signJwt(payload: object, expiresIn: string | number = '7d') {
    const options: SignOptions = { expiresIn: expiresIn as any };
    return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyJwt(token: string) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

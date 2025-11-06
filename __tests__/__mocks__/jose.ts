// Mock jose library for Jest tests
export class SignJWT {
  private payload: any;
  private header: any;

  constructor(payload: any) {
    this.payload = payload;
  }

  setProtectedHeader(header: any) {
    this.header = header;
    return this;
  }

  setExpirationTime(exp: string) {
    return this;
  }

  setIssuedAt() {
    return this;
  }

  async sign(secret: Uint8Array | string): Promise<string> {
    // Return a mock JWT token
    const mockToken = Buffer.from(
      JSON.stringify({ ...this.payload, ...this.header })
    ).toString('base64');
    return `mock.jwt.${mockToken}`;
  }
}

export async function jwtVerify(token: string, secret: Uint8Array | string) {
  // Mock JWT verification
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT');
    
    const payload = JSON.parse(Buffer.from(parts[2], 'base64').toString());
    
    return {
      payload,
      protectedHeader: { alg: 'HS256' },
    };
  } catch (error) {
    throw new Error('JWT verification failed');
  }
}

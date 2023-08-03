export interface SignupReqBody {
  name: string;
  email: string;
  password: string;
}

export interface ResendEmailReqBody {
  email: string;
}

export interface SigninReqBody {
  email: string;
  password: string;
}

export interface PayloadForTokens {
  sub: string;
  username: string;
}

export interface TokensPair {
  accessToken: string;
  refreshToken: string;
}

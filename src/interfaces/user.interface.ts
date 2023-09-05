import Roles from 'src/roles/roles.enum';

export interface SignupReqBody {
  name: string;
  email: string;
  password: string;
}

export interface OuterSignupReqBody {
  name: string;
  email: string;
}

export interface ResendEmailReqBody {
  email: string;
}

export interface SigninReqBody {
  email: string;
  password: string;
  isRemember: boolean;
}

export interface SignoutReqBody {
  email: string;
}

export interface PostConfirmVisitDateBody {
  role: Roles.Admin;
  visitDate: string;
}

export interface ChangePasswordBody {
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

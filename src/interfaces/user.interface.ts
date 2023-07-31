export interface SignupReqBody { 
    name: string;
    email: string;
    password: string;
};

export interface ResendEmailReqBody {
    email: string;
}

export interface SigninReqBody {
    email: string;
    password: string;
}
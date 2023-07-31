export interface SignupReqBody { 
    name: string;
    email: string;
    password: string;
};

export interface ResendEmailReqBody {
    email: string;
}
import Roles from 'src/roles/roles.enum';

export interface AddNewVisitDateBody {
  role: Roles.Admin;
  dates: number[];
}

export interface ReserveVisitDateBody {
  role: Roles.User;
}

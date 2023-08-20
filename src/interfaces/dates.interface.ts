import Roles from 'src/roles/roles.enum';

export interface AddNewVisitDateBody {
  role: Roles.Admin;
  dates: number[];
}

export interface AlterVisitDateByAdminBody {
  role: Roles.Admin;
  alteredDate: number;
}

export interface PastVisitDate {
  date: Date;
  postConfirmed: boolean;
}


interface ClientData {
  clientID?: string;
  clientName?: string;
  clientGender?: string;
  clientSSN?: string;
  clientDOB?: string;
  clientAnniversaryDate?: string;
  clientRecertification?: string;
  clientAddress1?: string;
  clientAddress2?: string;
  clientCityStateZip?: string;
  clientCounty?: string;
  clientOffice?: string;
  clientDateOfService?: string;
  clientPlanDate?: string;
}


interface UserSession {
  // browser: Browser;
  totalData: number;
  totalDataSaved: number;
}

export { ClientData, UserSession };


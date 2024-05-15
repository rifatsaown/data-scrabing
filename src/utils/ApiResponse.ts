// Used for sending responses to the client in a standard format with a status code, data, and message properties. 
class ApiResponse {
    statusCode: number;
    data: any;
    message: string;
    success: boolean;
    constructor(statusCode:number , data: any , message= "Success") {
        this.statusCode = statusCode; 
        this.data = data; 
        this.message = message;
        this.success = statusCode < 400;
    }
}

export { ApiResponse };
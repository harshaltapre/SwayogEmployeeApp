export class WorkDescription {
    id: number;
    employeeId: number;
    description: string;
    timestamp: Date;

    constructor(id: number, employeeId: number, description: string, timestamp: Date) {
        this.id = id;
        this.employeeId = employeeId;
        this.description = description;
        this.timestamp = timestamp;
    }
}
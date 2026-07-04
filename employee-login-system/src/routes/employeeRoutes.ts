import { Router } from 'express';
import { EmployeeController } from '../controllers/employeeController';

const router = Router();
const employeeController = new EmployeeController();

// Route for submitting work description
router.post('/work-description', employeeController.submitWorkDescription);

// Route for retrieving employee data
router.get('/:id', employeeController.getEmployeeData);

export const employeeRoutes = router;
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import companiesRouter from "./companies";
import usersRouter from "./users";
import locationsRouter from "./locations";
import stockGroupsRouter from "./stockGroups";
import stockItemsRouter from "./stockItems";
import suppliersRouter from "./suppliers";
import containersRouter from "./containers";
import accountsRouter from "./accounts";
import vouchersRouter from "./vouchers";
import employeesRouter from "./employees";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(companiesRouter);
router.use(usersRouter);
router.use(locationsRouter);
router.use(stockGroupsRouter);
router.use(stockItemsRouter);
router.use(suppliersRouter);
router.use(containersRouter);
router.use(accountsRouter);
router.use(vouchersRouter);
router.use(employeesRouter);
router.use(dashboardRouter);

export default router;

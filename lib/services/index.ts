// Import all services
import { productService } from "./product-service"
import { ingredientService } from "./ingredient-service"
import { customerService } from "./customer-service"
import { saleService } from "./sale-service"
import { categoryService } from "./category-service"
import { sizeService } from "./size-service"
import { branchService } from "./branch-service"
import { employeeService } from "./employee-service"
import { reservationService } from "./reservation-service"
import { userService } from "./user-service"
import { storeService } from "./store-service"
import { notificationService } from "./notification-service"

// Export all services
export {
  productService,
  ingredientService,
  customerService,
  saleService,
  categoryService,
  sizeService,
  branchService,
  employeeService,
  reservationService,
  userService,
  storeService,
  notificationService,
}

// Export types from services
export type { Branch } from "./branch-service"
export type { Category } from "./category-service"
export type { Customer } from "./customer-service"
export type { Employee } from "./employee-service"
export type { Ingredient } from "./ingredient-service"
export type { Product } from "./product-service"
export type { Reservation } from "./reservation-service"
export type { Sale } from "./sale-service"
export type { Size } from "./size-service"
export type { UserData } from "./user-service"
export type { StoreSettings } from "./store-service"

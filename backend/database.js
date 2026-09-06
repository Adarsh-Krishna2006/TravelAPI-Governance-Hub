import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, 'db.json');

export const DEFAULT_ORGANISATIONS = [
  { id: 'org-ts', name: 'TravelSphere Internal', type: 'Internal', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'org-flyfast', name: 'FlyFast Airlines', type: 'External', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'org-globalhotels', name: 'GlobalHotels', type: 'External', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'org-stayeasy', name: 'StayEasy', type: 'External', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'org-paylink', name: 'PayLink', type: 'External', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'org-securepay', name: 'SecurePay', type: 'External', status: 'Active', createdAt: '2026-01-01T00:00:00Z' }
];

export const DEFAULT_USERS = [
  { id: 'usr-admin', name: 'Alice Admin', email: 'admin@travelsphere.demo', role: 'Admin', organisationId: 'org-ts' },
  { id: 'usr-owner', name: 'Bob Owner', email: 'owner@travelsphere.demo', role: 'API Owner', organisationId: 'org-ts' },
  { id: 'usr-partner', name: 'Charlie Partner', email: 'partner@flyfast.demo', role: 'External Partner', organisationId: 'org-flyfast' },
  { id: 'usr-auditor', name: 'Diana Auditor', email: 'auditor@travelsphere.demo', role: 'Auditor', organisationId: 'org-ts' }
];

export const DEFAULT_SETTINGS = {
  weights: { route: 20, method: 10, category: 20, fields: 20, semantics: 25, output: 5 },
  thresholds: { high: 85, potential: 65, overlap: 40 }
};

export const DEFAULT_APIS = [
  { id: 'api-ts-hotel-booking', name: 'TravelSphere Hotel Bookings API', description: 'Core internal hotel room reservation service.', organisationId: 'org-ts', ownerId: 'usr-owner', category: 'Hotel Booking', visibility: 'Public', version: '1.0.0', status: 'Active', gatewayBaseUrl: '/gateway/bookings', governanceStatus: 'Active', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-ts-flight-booking', name: 'TravelSphere Flight Bookings API', description: 'Internal flight itinerary booking service.', organisationId: 'org-ts', ownerId: 'usr-owner', category: 'Flight Booking', visibility: 'Public', version: '1.0.0', status: 'Active', gatewayBaseUrl: '/gateway/flight-bookings', governanceStatus: 'Active', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-ts-res-query', name: 'TravelSphere Reservation Query API', description: 'Fetches details of active reservations.', organisationId: 'org-ts', ownerId: 'usr-owner', category: 'Reservation Management', visibility: 'Public', version: '1.0.0', status: 'Active', gatewayBaseUrl: '/gateway/reservations-query', governanceStatus: 'Active', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-ts-cancel-booking', name: 'TravelSphere Cancel Booking API', description: 'Cancels travel reservations by ID.', organisationId: 'org-ts', ownerId: 'usr-owner', category: 'Reservation Management', visibility: 'Public', version: '1.0.0', status: 'Active', gatewayBaseUrl: '/gateway/bookings-cancel', governanceStatus: 'Active', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-ts-flight-search', name: 'TravelSphere Flight Search API', description: 'Searches flight catalogues by origin and destination.', organisationId: 'org-ts', ownerId: 'usr-owner', category: 'Availability Search', visibility: 'Public', version: '1.2.0', status: 'Active', gatewayBaseUrl: '/gateway/flights-search', governanceStatus: 'Active', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-ts-book-flight', name: 'TravelSphere Book Flight API', description: 'Books seats for passenger itineraries.', organisationId: 'org-ts', ownerId: 'usr-owner', category: 'Flight Booking', visibility: 'Public', version: '1.2.0', status: 'Active', gatewayBaseUrl: '/gateway/flights-book', governanceStatus: 'Active', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-ts-hotel-search', name: 'TravelSphere Hotel Search API', description: 'Searches hotels by city and check-in date.', organisationId: 'org-ts', ownerId: 'usr-owner', category: 'Availability Search', visibility: 'Public', version: '1.0.0', status: 'Active', gatewayBaseUrl: '/gateway/hotels-search', governanceStatus: 'Active', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-ts-reserve-hotel', name: 'TravelSphere Reserve Hotel API', description: 'Reserves hotel room slots.', organisationId: 'org-ts', ownerId: 'usr-owner', category: 'Hotel Booking', visibility: 'Public', version: '1.0.0', status: 'Active', gatewayBaseUrl: '/gateway/hotels-reserve', governanceStatus: 'Active', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-ts-payment-gateway', name: 'TravelSphere Payment Gateway API', description: 'Charges digital card tokens for purchases.', organisationId: 'org-ts', ownerId: 'usr-owner', category: 'Payment Processing', visibility: 'Public', version: '1.0.0', status: 'Active', gatewayBaseUrl: '/gateway/payments', governanceStatus: 'Active', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-ts-refund-processing', name: 'TravelSphere Refund Processing API', description: 'Processes booking transaction refunds.', organisationId: 'org-ts', ownerId: 'usr-owner', category: 'Refund Processing', visibility: 'Public', version: '1.0.0', status: 'Active', gatewayBaseUrl: '/gateway/refunds', governanceStatus: 'Active', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-ts-payment-status', name: 'TravelSphere Payment Status API', description: 'Checks completion status of payments.', organisationId: 'org-ts', ownerId: 'usr-owner', category: 'Payment Processing', visibility: 'Public', version: '1.0.0', status: 'Active', gatewayBaseUrl: '/gateway/payments-status', governanceStatus: 'Active', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-ts-customer-registry', name: 'TravelSphere Customer Registry API', description: 'Registers new guest user profiles.', organisationId: 'org-ts', ownerId: 'usr-owner', category: 'Customer Information', visibility: 'Public', version: '1.0.0', status: 'Active', gatewayBaseUrl: '/gateway/customers', governanceStatus: 'Active', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-ts-customer-profile', name: 'TravelSphere Customer Profile API', description: 'Fetches profile metadata by customer ID.', organisationId: 'org-ts', ownerId: 'usr-owner', category: 'Customer Information', visibility: 'Public', version: '1.0.0', status: 'Active', gatewayBaseUrl: '/gateway/customers-profile', governanceStatus: 'Active', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-ts-travel-orders', name: 'TravelSphere Travel Orders Engine API', description: 'Manages aggregated travel itinerary orders.', organisationId: 'org-ts', ownerId: 'usr-owner', category: 'Travel Orders', visibility: 'Public', version: '1.0.0', status: 'Active', gatewayBaseUrl: '/gateway/travel-orders', governanceStatus: 'Active', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-flyfast-reserve', name: 'FlyFast Flight Reserve API', description: 'FlyFast airline seat reservation gateway.', organisationId: 'org-flyfast', ownerId: 'usr-partner', category: 'Flight Booking', visibility: 'Public', version: '2.0.0', status: 'Active', gatewayBaseUrl: '/gateway/flyfast-reserve', governanceStatus: 'Active', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-flyfast-search', name: 'FlyFast Flight Search API', description: 'FlyFast route and schedule query.', organisationId: 'org-flyfast', ownerId: 'usr-partner', category: 'Availability Search', visibility: 'Public', version: '2.0.0', status: 'Active', gatewayBaseUrl: '/gateway/flyfast-search', governanceStatus: 'Active', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-flyfast-flyer', name: 'FlyFast Frequent Flyer API', description: 'Frequent flyer points and membership info.', organisationId: 'org-flyfast', ownerId: 'usr-partner', category: 'Customer Information', visibility: 'Private', version: '1.1.0', status: 'Active', gatewayBaseUrl: '/gateway/flyfast-flyer', governanceStatus: 'Active', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-flyfast-passports', name: 'FlyFast Passport Scanner API', description: 'Verifies international passport credentials.', organisationId: 'org-flyfast', ownerId: 'usr-partner', category: 'Customer Information', visibility: 'Private', version: '1.0.0', status: 'Active', gatewayBaseUrl: '/gateway/flyfast-passports', governanceStatus: 'Active', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-globalhotels-book', name: 'GlobalHotels Book Room API', description: 'GlobalHotels partner room booking service.', organisationId: 'org-globalhotels', ownerId: 'usr-partner', category: 'Hotel Booking', visibility: 'Public', version: '1.4.0', status: 'Active', gatewayBaseUrl: '/gateway/globalhotels-book', governanceStatus: 'Active', createdAt: '2026-02-15T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-globalhotels-query', name: 'GlobalHotels Query Reservation API', description: 'Queries reservation state by voucher code.', organisationId: 'org-globalhotels', ownerId: 'usr-partner', category: 'Reservation Management', visibility: 'Public', version: '1.4.0', status: 'Active', gatewayBaseUrl: '/gateway/globalhotels-query', governanceStatus: 'Active', createdAt: '2026-02-15T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-globalhotels-rates', name: 'GlobalHotels Rates Search API', description: 'Fetches hotel room pricing tiers.', organisationId: 'org-globalhotels', ownerId: 'usr-partner', category: 'Availability Search', visibility: 'Public', version: '1.4.0', status: 'Active', gatewayBaseUrl: '/gateway/globalhotels-rates', governanceStatus: 'Active', createdAt: '2026-02-15T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-stayeasy-reserve', name: 'StayEasy Reserve Room API', description: 'StayEasy partner room reservation API.', organisationId: 'org-stayeasy', ownerId: 'usr-partner', category: 'Hotel Booking', visibility: 'Public', version: '1.0.0', status: 'Active', gatewayBaseUrl: '/gateway/stayeasy-reserve', governanceStatus: 'Active', createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-stayeasy-mgmt', name: 'StayEasy Reservation Management API', description: 'Handles partner stay reservation order management.', organisationId: 'org-stayeasy', ownerId: 'usr-partner', category: 'Travel Orders', visibility: 'Public', version: '2.0.0', status: 'Active', gatewayBaseUrl: '/gateway/stayeasy-mgmt', governanceStatus: 'Active', createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-paylink-transact', name: 'PayLink Merchant Transact API', description: 'PayLink merchant payment transaction gateway.', organisationId: 'org-paylink', ownerId: 'usr-partner', category: 'Payment Processing', visibility: 'Public', version: '4.0.0', status: 'Active', gatewayBaseUrl: '/gateway/paylink-transact', governanceStatus: 'Active', createdAt: '2026-03-10T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' },
  { id: 'api-securepay-transactions', name: 'SecurePay Charge Transaction API', description: 'SecurePay credit card charge service.', organisationId: 'org-securepay', ownerId: 'usr-partner', category: 'Payment Processing', visibility: 'Public', version: '2.0.0', status: 'Active', gatewayBaseUrl: '/gateway/securepay-transactions', governanceStatus: 'Active', createdAt: '2026-03-15T00:00:00Z', updatedAt: '2026-08-25T12:00:00Z' }
];

export const DEFAULT_ENDPOINTS = [
  // 1. api-ts-hotel-booking (3 endpoints)
  { id: 'ep-ts-hotel-book', apiId: 'api-ts-hotel-booking', path: '/api/v1/bookings', httpMethod: 'POST', description: 'Creates a new hotel booking reservation.', operationId: 'createBooking' },
  { id: 'ep-ts-hotel-get', apiId: 'api-ts-hotel-booking', path: '/api/v1/bookings/{id}', httpMethod: 'GET', description: 'Retrieves booking by ID.', operationId: 'getBookingById' },
  { id: 'ep-ts-hotel-del', apiId: 'api-ts-hotel-booking', path: '/api/v1/bookings/{id}', httpMethod: 'DELETE', description: 'Cancels hotel booking.', operationId: 'cancelBookingById' },

  // 2. api-ts-flight-booking (3 endpoints)
  { id: 'ep-ts-flight-book', apiId: 'api-ts-flight-booking', path: '/api/v1/flight-bookings', httpMethod: 'POST', description: 'Creates a new flight itinerary booking.', operationId: 'createFlightBooking' },
  { id: 'ep-ts-flight-get', apiId: 'api-ts-flight-booking', path: '/api/v1/flight-bookings/{id}', httpMethod: 'GET', description: 'Retrieves flight ticket info.', operationId: 'getFlightBooking' },
  { id: 'ep-ts-flight-del', apiId: 'api-ts-flight-booking', path: '/api/v1/flight-bookings/{id}', httpMethod: 'DELETE', description: 'Voids ticket booking.', operationId: 'voidFlightBooking' },

  // 3. api-ts-res-query (3 endpoints)
  { id: 'ep-ts-res-list', apiId: 'api-ts-res-query', path: '/api/v1/reservations', httpMethod: 'GET', description: 'Queries reservations list.', operationId: 'listReservations' },
  { id: 'ep-ts-res-detail', apiId: 'api-ts-res-query', path: '/api/v1/reservations/{resId}', httpMethod: 'GET', description: 'Retrieves reservation summary details.', operationId: 'getReservationSummary' },
  { id: 'ep-ts-res-filter', apiId: 'api-ts-res-query', path: '/api/v1/reservations/search', httpMethod: 'POST', description: 'Filtered reservations lookup.', operationId: 'filterReservations' },

  // 4. api-ts-cancel-booking (3 endpoints)
  { id: 'ep-ts-cancel-post', apiId: 'api-ts-cancel-booking', path: '/api/v1/bookings/cancel', httpMethod: 'POST', description: 'Submits cancellation request.', operationId: 'cancelBooking' },
  { id: 'ep-ts-cancel-status', apiId: 'api-ts-cancel-booking', path: '/api/v1/bookings/cancel/{cancelId}', httpMethod: 'GET', description: 'Checks cancellation request status.', operationId: 'getCancelStatus' },
  { id: 'ep-ts-cancel-preview', apiId: 'api-ts-cancel-booking', path: '/api/v1/bookings/cancel/preview', httpMethod: 'POST', description: 'Calculates penalty fees for cancellation.', operationId: 'previewCancelPenalty' },

  // 5. api-ts-flight-search (3 endpoints)
  { id: 'ep-ts-flt-search', apiId: 'api-ts-flight-search', path: '/api/v1/flights/search', httpMethod: 'GET', description: 'Searches flight itineraries.', operationId: 'searchFlights' },
  { id: 'ep-ts-flt-avail', apiId: 'api-ts-flight-search', path: '/api/v1/flights/{flightNum}/availability', httpMethod: 'GET', description: 'Checks seat availability.', operationId: 'checkSeatAvailability' },
  { id: 'ep-ts-flt-fares', apiId: 'api-ts-flight-search', path: '/api/v1/flights/fares', httpMethod: 'POST', description: 'Quotes airfare pricing calendar.', operationId: 'quoteFares' },

  // 6. api-ts-book-flight (3 endpoints)
  { id: 'ep-ts-flt-book', apiId: 'api-ts-book-flight', path: '/api/v1/flights/book', httpMethod: 'POST', description: 'Books passenger seats.', operationId: 'bookFlightSeats' },
  { id: 'ep-ts-flt-confirm', apiId: 'api-ts-book-flight', path: '/api/v1/flights/confirm/{ticketId}', httpMethod: 'POST', description: 'Confirms e-ticket issuance.', operationId: 'confirmTicket' },
  { id: 'ep-ts-flt-ticket', apiId: 'api-ts-book-flight', path: '/api/v1/flights/tickets/{ticketId}', httpMethod: 'GET', description: 'Downloads boarding ticket receipt.', operationId: 'getTicket' },

  // 7. api-ts-hotel-search (3 endpoints)
  { id: 'ep-ts-htl-search', apiId: 'api-ts-hotel-search', path: '/api/v1/hotels/search', httpMethod: 'GET', description: 'Searches hotel rooms.', operationId: 'searchHotels' },
  { id: 'ep-ts-htl-avail', apiId: 'api-ts-hotel-search', path: '/api/v1/hotels/{hotelId}/rooms', httpMethod: 'GET', description: 'Lists available rooms by hotel.', operationId: 'getHotelRooms' },
  { id: 'ep-ts-htl-price', apiId: 'api-ts-hotel-search', path: '/api/v1/hotels/rates', httpMethod: 'POST', description: 'Calculates night stay rate.', operationId: 'quoteHotelRate' },

  // 8. api-ts-reserve-hotel (3 endpoints)
  { id: 'ep-ts-htl-reserve', apiId: 'api-ts-reserve-hotel', path: '/api/v1/hotels/reserve', httpMethod: 'POST', description: 'Reserves room slot.', operationId: 'reserveHotelRoom' },
  { id: 'ep-ts-htl-hold', apiId: 'api-ts-reserve-hotel', path: '/api/v1/hotels/hold', httpMethod: 'POST', description: 'Places temporary 15-minute room hold.', operationId: 'holdHotelRoom' },
  { id: 'ep-ts-htl-release', apiId: 'api-ts-reserve-hotel', path: '/api/v1/hotels/hold/{holdId}', httpMethod: 'DELETE', description: 'Releases temporary room hold.', operationId: 'releaseHotelHold' },

  // 9. api-ts-payment-gateway (3 endpoints)
  { id: 'ep-ts-pay-create', apiId: 'api-ts-payment-gateway', path: '/api/v1/payments', httpMethod: 'POST', description: 'Executes card charge transaction.', operationId: 'processPayment' },
  { id: 'ep-ts-pay-get', apiId: 'api-ts-payment-gateway', path: '/api/v1/payments/{id}', httpMethod: 'GET', description: 'Retrieves payment details.', operationId: 'getPayment' },
  { id: 'ep-ts-pay-auth', apiId: 'api-ts-payment-gateway', path: '/api/v1/payments/authorize', httpMethod: 'POST', description: 'Pre-authorizes payment hold.', operationId: 'authPayment' },

  // 10. api-ts-refund-processing (3 endpoints)
  { id: 'ep-ts-refund', apiId: 'api-ts-refund-processing', path: '/api/v1/payments/refund', httpMethod: 'POST', description: 'Refunds payment transaction.', operationId: 'refundPayment' },
  { id: 'ep-ts-refund-status', apiId: 'api-ts-refund-processing', path: '/api/v1/payments/refund/{refundId}', httpMethod: 'GET', description: 'Gets refund settlement status.', operationId: 'getRefundStatus' },
  { id: 'ep-ts-refund-history', apiId: 'api-ts-refund-processing', path: '/api/v1/payments/{paymentId}/refunds', httpMethod: 'GET', description: 'Lists refunds for payment.', operationId: 'listRefunds' },

  // 11. api-ts-payment-status (3 endpoints)
  { id: 'ep-ts-pay-status', apiId: 'api-ts-payment-status', path: '/api/v1/payments/status/{txId}', httpMethod: 'GET', description: 'Queries payment status.', operationId: 'getPaymentStatus' },
  { id: 'ep-ts-pay-receipt', apiId: 'api-ts-payment-status', path: '/api/v1/payments/receipt/{txId}', httpMethod: 'GET', description: 'Gets receipt PDF URL.', operationId: 'getPaymentReceipt' },
  { id: 'ep-ts-pay-verify', apiId: 'api-ts-payment-status', path: '/api/v1/payments/verify-3ds', httpMethod: 'POST', description: 'Validates 3DS authentication challenge.', operationId: 'verify3DS' },

  // 12. api-ts-customer-registry (3 endpoints)
  { id: 'ep-ts-cust-reg', apiId: 'api-ts-customer-registry', path: '/api/v1/customers/register', httpMethod: 'POST', description: 'Registers customer profile.', operationId: 'registerCustomer' },
  { id: 'ep-ts-cust-lookup', apiId: 'api-ts-customer-registry', path: '/api/v1/customers/lookup', httpMethod: 'GET', description: 'Looks up customer by email.', operationId: 'lookupCustomer' },
  { id: 'ep-ts-cust-update', apiId: 'api-ts-customer-registry', path: '/api/v1/customers/{id}', httpMethod: 'PUT', description: 'Updates customer information.', operationId: 'updateCustomer' },

  // 13. api-ts-customer-profile (3 endpoints)
  { id: 'ep-ts-cust-prof', apiId: 'api-ts-customer-profile', path: '/api/v1/customers/{id}/profile', httpMethod: 'GET', description: 'Gets customer attributes.', operationId: 'getCustomerProfile' },
  { id: 'ep-ts-cust-prefs', apiId: 'api-ts-customer-profile', path: '/api/v1/customers/{id}/preferences', httpMethod: 'PUT', description: 'Updates travel preferences.', operationId: 'updatePreferences' },
  { id: 'ep-ts-cust-delete', apiId: 'api-ts-customer-profile', path: '/api/v1/customers/{id}', httpMethod: 'DELETE', description: 'GDPR deletion request.', operationId: 'deleteProfile' },

  // 14. api-ts-travel-orders (3 endpoints)
  { id: 'ep-ts-orders', apiId: 'api-ts-travel-orders', path: '/api/v1/travel-orders', httpMethod: 'POST', description: 'Creates aggregated travel itinerary order.', operationId: 'createTravelOrder' },
  { id: 'ep-ts-orders-get', apiId: 'api-ts-travel-orders', path: '/api/v1/travel-orders/{orderId}', httpMethod: 'GET', description: 'Retrieves itinerary order.', operationId: 'getOrder' },
  { id: 'ep-ts-orders-cancel', apiId: 'api-ts-travel-orders', path: '/api/v1/travel-orders/{orderId}/cancel', httpMethod: 'POST', description: 'Cancels whole itinerary package.', operationId: 'cancelOrder' },

  // 15. api-flyfast-reserve (3 endpoints)
  { id: 'ep-ff-reserve', apiId: 'api-flyfast-reserve', path: '/flyfast/v2/reservations', httpMethod: 'POST', description: 'Places FlyFast flight seat reservation.', operationId: 'flyfastReserve' },
  { id: 'ep-ff-res-get', apiId: 'api-flyfast-reserve', path: '/flyfast/v2/reservations/{pnr}', httpMethod: 'GET', description: 'Gets FlyFast PNR record.', operationId: 'flyfastGetPNR' },
  { id: 'ep-ff-res-void', apiId: 'api-flyfast-reserve', path: '/flyfast/v2/reservations/{pnr}', httpMethod: 'DELETE', description: 'Voids FlyFast reservation.', operationId: 'flyfastCancelPNR' },

  // 16. api-flyfast-search (3 endpoints)
  { id: 'ep-ff-search', apiId: 'api-flyfast-search', path: '/flyfast/v2/flights', httpMethod: 'GET', description: 'Queries FlyFast flight catalogue.', operationId: 'flyfastSearch' },
  { id: 'ep-ff-routes', apiId: 'api-flyfast-search', path: '/flyfast/v2/routes', httpMethod: 'GET', description: 'Lists direct FlyFast airline routes.', operationId: 'flyfastRoutes' },
  { id: 'ep-ff-schedule', apiId: 'api-flyfast-search', path: '/flyfast/v2/schedule/{flightCode}', httpMethod: 'GET', description: 'Queries timetable schedules.', operationId: 'flyfastSchedule' },

  // 17. api-flyfast-flyer (3 endpoints)
  { id: 'ep-ff-flyer', apiId: 'api-flyfast-flyer', path: '/flyfast/v2/frequent-flyer', httpMethod: 'POST', description: 'Enrolls in points program.', operationId: 'enrollFlyer' },
  { id: 'ep-ff-points', apiId: 'api-flyfast-flyer', path: '/flyfast/v2/frequent-flyer/{memberId}/points', httpMethod: 'GET', description: 'Queries points balance.', operationId: 'getFlyerPoints' },
  { id: 'ep-ff-tier', apiId: 'api-flyfast-flyer', path: '/flyfast/v2/frequent-flyer/{memberId}/tier', httpMethod: 'GET', description: 'Queries loyalty tier benefits.', operationId: 'getFlyerTier' },

  // 18. api-flyfast-passports (3 endpoints)
  { id: 'ep-ff-passport', apiId: 'api-flyfast-passports', path: '/flyfast/v2/passports', httpMethod: 'POST', description: 'Validates passport data.', operationId: 'verifyPassport' },
  { id: 'ep-ff-passport-status', apiId: 'api-flyfast-passports', path: '/flyfast/v2/passports/check/{docId}', httpMethod: 'GET', description: 'Checks document status.', operationId: 'checkPassport' },
  { id: 'ep-ff-passport-visa', apiId: 'api-flyfast-passports', path: '/flyfast/v2/passports/visa-check', httpMethod: 'POST', description: 'Verifies visa entry requirements.', operationId: 'verifyVisa' },

  // 19. api-globalhotels-book (3 endpoints)
  { id: 'ep-gh-book', apiId: 'api-globalhotels-book', path: '/globalhotels/v1/bookings', httpMethod: 'POST', description: 'Confirms guest room booking on GlobalHotels grid.', operationId: 'ghBookRoom' },
  { id: 'ep-gh-get', apiId: 'api-globalhotels-book', path: '/globalhotels/v1/bookings/{id}', httpMethod: 'GET', description: 'Fetches GlobalHotels booking.', operationId: 'ghGetBooking' },
  { id: 'ep-gh-cancel', apiId: 'api-globalhotels-book', path: '/globalhotels/v1/bookings/{id}/cancel', httpMethod: 'POST', description: 'Cancels GlobalHotels stay.', operationId: 'ghCancelBooking' },

  // 20. api-globalhotels-query (3 endpoints)
  { id: 'ep-gh-query', apiId: 'api-globalhotels-query', path: '/globalhotels/v1/bookings/query/{id}', httpMethod: 'GET', description: 'Fetches GlobalHotels voucher details.', operationId: 'ghQueryRes' },
  { id: 'ep-gh-lookup', apiId: 'api-globalhotels-query', path: '/globalhotels/v1/bookings/voucher/{code}', httpMethod: 'GET', description: 'Validates voucher code.', operationId: 'ghVoucherLookup' },
  { id: 'ep-gh-audit', apiId: 'api-globalhotels-query', path: '/globalhotels/v1/bookings/audit/{id}', httpMethod: 'GET', description: 'Audits room checkout status.', operationId: 'ghAuditRes' },

  // 21. api-globalhotels-rates (3 endpoints)
  { id: 'ep-gh-rates', apiId: 'api-globalhotels-rates', path: '/globalhotels/v1/rates', httpMethod: 'GET', description: 'Queries room rate catalog.', operationId: 'ghSearchRates' },
  { id: 'ep-gh-occupancy', apiId: 'api-globalhotels-rates', path: '/globalhotels/v1/rates/occupancy', httpMethod: 'POST', description: 'Computes multi-occupancy pricing.', operationId: 'ghCalcOccupancy' },
  { id: 'ep-gh-calendar', apiId: 'api-globalhotels-rates', path: '/globalhotels/v1/rates/calendar', httpMethod: 'GET', description: 'Seasonal rates calendar.', operationId: 'ghCalendar' },

  // 22. api-stayeasy-reserve (3 endpoints)
  { id: 'ep-se-reserve', apiId: 'api-stayeasy-reserve', path: '/api/v1/reservations', httpMethod: 'POST', description: 'StayEasy room space reservation.', operationId: 'stayeasyReserve' },
  { id: 'ep-se-get', apiId: 'api-stayeasy-reserve', path: '/api/v1/reservations/{resId}', httpMethod: 'GET', description: 'Retrieves StayEasy reservation detail.', operationId: 'stayeasyGet' },
  { id: 'ep-se-cancel', apiId: 'api-stayeasy-reserve', path: '/api/v1/reservations/{resId}', httpMethod: 'DELETE', description: 'Cancels StayEasy room reservation.', operationId: 'stayeasyCancel' },

  // 23. api-stayeasy-mgmt (3 endpoints)
  { id: 'ep-se-mgmt', apiId: 'api-stayeasy-mgmt', path: '/api/v2/reservation-management', httpMethod: 'POST', description: 'StayEasy stay order management handler.', operationId: 'stayeasyMgmt' },
  { id: 'ep-se-mgmt-get', apiId: 'api-stayeasy-mgmt', path: '/api/v2/reservation-management/{orderKey}', httpMethod: 'GET', description: 'Fetches stay management order details.', operationId: 'stayeasyMgmtGet' },
  { id: 'ep-se-mgmt-mod', apiId: 'api-stayeasy-mgmt', path: '/api/v2/reservation-management/{orderKey}', httpMethod: 'PUT', description: 'Modifies stay dates and room parameters.', operationId: 'stayeasyMgmtMod' },

  // 24. api-paylink-transact (3 endpoints)
  { id: 'ep-pl-transact', apiId: 'api-paylink-transact', path: '/paylink/v4/transact', httpMethod: 'POST', description: 'Posts merchant payment charge to PayLink.', operationId: 'paylinkTransact' },
  { id: 'ep-pl-status', apiId: 'api-paylink-transact', path: '/paylink/v4/transact/{txCode}', httpMethod: 'GET', description: 'Queries transaction authorization status.', operationId: 'paylinkStatus' },
  { id: 'ep-pl-void', apiId: 'api-paylink-transact', path: '/paylink/v4/transact/{txCode}/void', httpMethod: 'POST', description: 'Voids unauthorized pending transaction.', operationId: 'paylinkVoid' },

  // 25. api-securepay-transactions (3 endpoints)
  { id: 'ep-sp-charge', apiId: 'api-securepay-transactions', path: '/api/v2/transactions', httpMethod: 'POST', description: 'Posts card transaction charge to SecurePay.', operationId: 'securepayCharge' },
  { id: 'ep-sp-get', apiId: 'api-securepay-transactions', path: '/api/v2/transactions/{txId}', httpMethod: 'GET', description: 'Retrieves card settlement state.', operationId: 'securepayGet' },
  { id: 'ep-sp-refund', apiId: 'api-securepay-transactions', path: '/api/v2/transactions/{txId}/refund', httpMethod: 'POST', description: 'Executes merchant refund through SecurePay.', operationId: 'securepayRefund' }
];

export const DEFAULT_FIELDS = [
  // 1. ep-ts-hotel-book (inputs & outputs)
  { id: 'f-1', endpointId: 'ep-ts-hotel-book', name: 'bookingId', dataType: 'string', direction: 'input', required: true, description: 'Unique booking identifier', semanticConcept: 'booking_identifier', format: 'uuid' },
  { id: 'f-2', endpointId: 'ep-ts-hotel-book', name: 'customerId', dataType: 'string', direction: 'input', required: true, description: 'Unique customer identifier', semanticConcept: 'customer_identifier', format: 'uuid' },
  { id: 'f-3', endpointId: 'ep-ts-hotel-book', name: 'hotelId', dataType: 'string', direction: 'input', required: true, description: 'Unique hotel property identifier', semanticConcept: 'property_identifier', format: 'string' },
  { id: 'f-4', endpointId: 'ep-ts-hotel-book', name: 'bookingDate', dataType: 'string', direction: 'input', required: true, description: 'Date booking was created', semanticConcept: 'creation_date', format: 'date' },
  { id: 'f-5', endpointId: 'ep-ts-hotel-book', name: 'checkInDate', dataType: 'string', direction: 'input', required: true, description: 'Stay calendar check-in date', semanticConcept: 'check_in_date', format: 'date' },
  { id: 'f-6', endpointId: 'ep-ts-hotel-book', name: 'checkOutDate', dataType: 'string', direction: 'input', required: true, description: 'Stay calendar check-out date', semanticConcept: 'check_out_date', format: 'date' },
  { id: 'f-7', endpointId: 'ep-ts-hotel-book', name: 'totalAmount', dataType: 'number', direction: 'input', required: true, description: 'Total cost of transaction', semanticConcept: 'monetary_amount', format: 'float' },
  { id: 'f-8', endpointId: 'ep-ts-hotel-book', name: 'currency', dataType: 'string', direction: 'input', required: true, description: 'Currency ISO code', semanticConcept: 'currency_code', format: 'string' },
  { id: 'f-8o', endpointId: 'ep-ts-hotel-book', name: 'confirmationCode', dataType: 'string', direction: 'output', required: true, description: 'Booking confirmation code', semanticConcept: 'booking_identifier', format: 'string' },
  { id: 'f-8o2', endpointId: 'ep-ts-hotel-book', name: 'status', dataType: 'string', direction: 'output', required: true, description: 'Reservation status', semanticConcept: 'transaction_status', format: 'string' },

  // 2. ep-se-reserve (StayEasy Hotel Duplicate)
  { id: 'f-9', endpointId: 'ep-se-reserve', name: 'reservation_id', dataType: 'string', direction: 'input', required: true, description: 'Unique registration code', semanticConcept: 'booking_identifier', format: 'uuid' },
  { id: 'f-10', endpointId: 'ep-se-reserve', name: 'guest_id', dataType: 'string', direction: 'input', required: true, description: 'Unique identifier of guest customer', semanticConcept: 'customer_identifier', format: 'uuid' },
  { id: 'f-11', endpointId: 'ep-se-reserve', name: 'property_id', dataType: 'string', direction: 'input', required: true, description: 'Target hotel property identifier', semanticConcept: 'property_identifier', format: 'string' },
  { id: 'f-12', endpointId: 'ep-se-reserve', name: 'reservation_date', dataType: 'string', direction: 'input', required: true, description: 'Date stay scheduled', semanticConcept: 'creation_date', format: 'date' },
  { id: 'f-13', endpointId: 'ep-se-reserve', name: 'check_in', dataType: 'string', direction: 'input', required: true, description: 'Calendar check-in date', semanticConcept: 'check_in_date', format: 'date' },
  { id: 'f-14', endpointId: 'ep-se-reserve', name: 'check_out', dataType: 'string', direction: 'input', required: true, description: 'Calendar check-out date', semanticConcept: 'check_out_date', format: 'date' },
  { id: 'f-15', endpointId: 'ep-se-reserve', name: 'amount', dataType: 'number', direction: 'input', required: true, description: 'Total amount paid', semanticConcept: 'monetary_amount', format: 'float' },
  { id: 'f-16', endpointId: 'ep-se-reserve', name: 'currency_code', dataType: 'string', direction: 'input', required: true, description: 'ISO Currency notation', semanticConcept: 'currency_code', format: 'string' },
  { id: 'f-16o', endpointId: 'ep-se-reserve', name: 'confirmation_id', dataType: 'string', direction: 'output', required: true, description: 'Stay confirmation voucher', semanticConcept: 'booking_identifier', format: 'string' },
  { id: 'f-16o2', endpointId: 'ep-se-reserve', name: 'status', dataType: 'string', direction: 'output', required: true, description: 'Booking confirmation status', semanticConcept: 'transaction_status', format: 'string' },

  // 3. ep-gh-book (GlobalHotels Book Room Duplicate)
  { id: 'f-gh-1', endpointId: 'ep-gh-book', name: 'booking_ref', dataType: 'string', direction: 'input', required: true, description: 'GlobalHotels booking ref', semanticConcept: 'booking_identifier', format: 'uuid' },
  { id: 'f-gh-2', endpointId: 'ep-gh-book', name: 'client_id', dataType: 'string', direction: 'input', required: true, description: 'Client account ID', semanticConcept: 'customer_identifier', format: 'uuid' },
  { id: 'f-gh-3', endpointId: 'ep-gh-book', name: 'hotel_code', dataType: 'string', direction: 'input', required: true, description: 'Hotel facility code', semanticConcept: 'property_identifier', format: 'string' },
  { id: 'f-gh-4', endpointId: 'ep-gh-book', name: 'arrival_date', dataType: 'string', direction: 'input', required: true, description: 'Arrival stay date', semanticConcept: 'check_in_date', format: 'date' },
  { id: 'f-gh-5', endpointId: 'ep-gh-book', name: 'departure_date', dataType: 'string', direction: 'input', required: true, description: 'Departure stay date', semanticConcept: 'check_out_date', format: 'date' },
  { id: 'f-gh-6', endpointId: 'ep-gh-book', name: 'total_cost', dataType: 'number', direction: 'input', required: true, description: 'Total booking price', semanticConcept: 'monetary_amount', format: 'float' },
  { id: 'f-gh-7', endpointId: 'ep-gh-book', name: 'currency_iso', dataType: 'string', direction: 'input', required: true, description: 'ISO currency symbol', semanticConcept: 'currency_code', format: 'string' },

  // 4. ep-ts-pay-create (TravelSphere Payment Gateway)
  { id: 'f-17', endpointId: 'ep-ts-pay-create', name: 'paymentId', dataType: 'string', direction: 'input', required: true, description: 'Unique payment reference ID', semanticConcept: 'transaction_identifier', format: 'uuid' },
  { id: 'f-18', endpointId: 'ep-ts-pay-create', name: 'customerId', dataType: 'string', direction: 'input', required: true, description: 'Payer account identifier', semanticConcept: 'customer_identifier', format: 'uuid' },
  { id: 'f-19', endpointId: 'ep-ts-pay-create', name: 'amount', dataType: 'number', direction: 'input', required: true, description: 'Charge total monetary price', semanticConcept: 'monetary_amount', format: 'float' },
  { id: 'f-20', endpointId: 'ep-ts-pay-create', name: 'currency', dataType: 'string', direction: 'input', required: true, description: 'ISO Currency code', semanticConcept: 'currency_code', format: 'string' },
  { id: 'f-21', endpointId: 'ep-ts-pay-create', name: 'paymentDate', dataType: 'string', direction: 'input', required: true, description: 'Timestamp payment processed', semanticConcept: 'creation_date', format: 'date-time' },
  { id: 'f-22', endpointId: 'ep-ts-pay-create', name: 'status', dataType: 'string', direction: 'output', required: true, description: 'Payment clearance state', semanticConcept: 'transaction_status', format: 'string' },

  // 5. ep-sp-charge (SecurePay Duplicate)
  { id: 'f-23', endpointId: 'ep-sp-charge', name: 'transaction_id', dataType: 'string', direction: 'input', required: true, description: 'Unique reference transaction ID', semanticConcept: 'transaction_identifier', format: 'uuid' },
  { id: 'f-24', endpointId: 'ep-sp-charge', name: 'payer_id', dataType: 'string', direction: 'input', required: true, description: 'User account identifier', semanticConcept: 'customer_identifier', format: 'uuid' },
  { id: 'f-25', endpointId: 'ep-sp-charge', name: 'total_amount', dataType: 'number', direction: 'input', required: true, description: 'Total charge value price', semanticConcept: 'monetary_amount', format: 'float' },
  { id: 'f-26', endpointId: 'ep-sp-charge', name: 'currency_code', dataType: 'string', direction: 'input', required: true, description: 'ISO Currency code', semanticConcept: 'currency_code', format: 'string' },
  { id: 'f-27', endpointId: 'ep-sp-charge', name: 'transaction_date', dataType: 'string', direction: 'input', required: true, description: 'Date transaction posted', semanticConcept: 'creation_date', format: 'date-time' },
  { id: 'f-28', endpointId: 'ep-sp-charge', name: 'payment_status', dataType: 'string', direction: 'output', required: true, description: 'Transaction settlement status', semanticConcept: 'transaction_status', format: 'string' },

  // 6. ep-pl-transact (PayLink Merchant Duplicate)
  { id: 'f-29', endpointId: 'ep-pl-transact', name: 'tx_reference_id', dataType: 'string', direction: 'input', required: true, description: 'Merchant transaction ID', semanticConcept: 'transaction_identifier', format: 'uuid' },
  { id: 'f-30', endpointId: 'ep-pl-transact', name: 'client_code', dataType: 'string', direction: 'input', required: true, description: 'Client account code', semanticConcept: 'customer_identifier', format: 'uuid' },
  { id: 'f-31', endpointId: 'ep-pl-transact', name: 'charge_total', dataType: 'number', direction: 'input', required: true, description: 'Total charged sum', semanticConcept: 'monetary_amount', format: 'float' },
  { id: 'f-32', endpointId: 'ep-pl-transact', name: 'currency', dataType: 'string', direction: 'input', required: true, description: 'ISO Currency code', semanticConcept: 'currency_code', format: 'string' },
  { id: 'f-33', endpointId: 'ep-pl-transact', name: 'tx_date', dataType: 'string', direction: 'input', required: true, description: 'Transaction execution timestamp', semanticConcept: 'creation_date', format: 'date-time' },
  { id: 'f-34', endpointId: 'ep-pl-transact', name: 'status_label', dataType: 'string', direction: 'output', required: true, description: 'Clearance response label', semanticConcept: 'transaction_status', format: 'string' },

  // 7. ep-ts-travel-orders (Travel Orders)
  { id: 'f-35', endpointId: 'ep-ts-orders', name: 'order_reference', dataType: 'string', direction: 'input', required: true, description: 'Travel order reference key', semanticConcept: 'booking_identifier', format: 'string' },
  { id: 'f-36', endpointId: 'ep-ts-orders', name: 'customer_id', dataType: 'string', direction: 'input', required: true, description: 'Customer identifier', semanticConcept: 'customer_identifier', format: 'uuid' },
  { id: 'f-37', endpointId: 'ep-ts-orders', name: 'order_total', dataType: 'number', direction: 'input', required: true, description: 'Total aggregated order price', semanticConcept: 'monetary_amount', format: 'float' },
  { id: 'f-38', endpointId: 'ep-ts-orders', name: 'currency', dataType: 'string', direction: 'input', required: true, description: 'Order currency ISO', semanticConcept: 'currency_code', format: 'string' },
  { id: 'f-39', endpointId: 'ep-ts-orders', name: 'order_status', dataType: 'string', direction: 'output', required: true, description: 'Order lifecycle state', semanticConcept: 'transaction_status', format: 'string' },

  // 8. ep-se-mgmt (StayEasy Reservation Mgmt - Difficult Semantic Duplicate)
  { id: 'f-40', endpointId: 'ep-se-mgmt', name: 'res_mgmt_key', dataType: 'string', direction: 'input', required: true, description: 'Reservation management key', semanticConcept: 'booking_identifier', format: 'string' },
  { id: 'f-41', endpointId: 'ep-se-mgmt', name: 'payer_id', dataType: 'string', direction: 'input', required: true, description: 'Registered guest payer ID', semanticConcept: 'customer_identifier', format: 'uuid' },
  { id: 'f-42', endpointId: 'ep-se-mgmt', name: 'charge_sum', dataType: 'number', direction: 'input', required: true, description: 'Total reservation sum', semanticConcept: 'monetary_amount', format: 'float' },
  { id: 'f-43', endpointId: 'ep-se-mgmt', name: 'currency_code', dataType: 'string', direction: 'input', required: true, description: 'Currency ISO identifier', semanticConcept: 'currency_code', format: 'string' },
  { id: 'f-44', endpointId: 'ep-se-mgmt', name: 'state', dataType: 'string', direction: 'output', required: true, description: 'Reservation management status', semanticConcept: 'transaction_status', format: 'string' },

  // 9. ep-ts-flight-book (TravelSphere Flight Booking - False Positive Control against Hotel Booking)
  { id: 'f-45', endpointId: 'ep-ts-flight-book', name: 'bookingId', dataType: 'string', direction: 'input', required: true, description: 'Flight booking code', semanticConcept: 'booking_identifier', format: 'uuid' },
  { id: 'f-46', endpointId: 'ep-ts-flight-book', name: 'passengerId', dataType: 'string', direction: 'input', required: true, description: 'Passenger ID token', semanticConcept: 'customer_identifier', format: 'uuid' },
  { id: 'f-47', endpointId: 'ep-ts-flight-book', name: 'flightNumber', dataType: 'string', direction: 'input', required: true, description: 'Airline flight code', semanticConcept: 'flight_identifier', format: 'string' },
  { id: 'f-48', endpointId: 'ep-ts-flight-book', name: 'departureAirport', dataType: 'string', direction: 'input', required: true, description: 'Origin IATA airport', semanticConcept: 'airport_code', format: 'string' },
  { id: 'f-49', endpointId: 'ep-ts-flight-book', name: 'arrivalAirport', dataType: 'string', direction: 'input', required: true, description: 'Destination IATA airport', semanticConcept: 'airport_code', format: 'string' },
  { id: 'f-50', endpointId: 'ep-ts-flight-book', name: 'ticketPrice', dataType: 'number', direction: 'input', required: true, description: 'Airfare ticket cost', semanticConcept: 'monetary_amount', format: 'float' },
  { id: 'f-51', endpointId: 'ep-ts-flight-book', name: 'currency', dataType: 'string', direction: 'input', required: true, description: 'Ticket currency', semanticConcept: 'currency_code', format: 'string' },

  // 10. ep-ff-reserve (FlyFast Flight Reserve - Partner Overlap with TravelSphere Flight Booking)
  { id: 'f-52', endpointId: 'ep-ff-reserve', name: 'pnrCode', dataType: 'string', direction: 'input', required: true, description: 'FlyFast passenger name record', semanticConcept: 'booking_identifier', format: 'string' },
  { id: 'f-53', endpointId: 'ep-ff-reserve', name: 'passengerId', dataType: 'string', direction: 'input', required: true, description: 'Passenger flyer identity', semanticConcept: 'customer_identifier', format: 'uuid' },
  { id: 'f-54', endpointId: 'ep-ff-reserve', name: 'flightNumber', dataType: 'string', direction: 'input', required: true, description: 'FlyFast flight schedule number', semanticConcept: 'flight_identifier', format: 'string' },
  { id: 'f-55', endpointId: 'ep-ff-reserve', name: 'origin', dataType: 'string', direction: 'input', required: true, description: 'Departure station code', semanticConcept: 'airport_code', format: 'string' },
  { id: 'f-56', endpointId: 'ep-ff-reserve', name: 'destination', dataType: 'string', direction: 'input', required: true, description: 'Arrival station code', semanticConcept: 'airport_code', format: 'string' },
  { id: 'f-57', endpointId: 'ep-ff-reserve', name: 'fareAmount', dataType: 'number', direction: 'input', required: true, description: 'Total flight fare', semanticConcept: 'monetary_amount', format: 'float' },
  { id: 'f-58', endpointId: 'ep-ff-reserve', name: 'currencyCode', dataType: 'string', direction: 'input', required: true, description: 'Currency code', semanticConcept: 'currency_code', format: 'string' }
];

export const DEFAULT_GOVERNANCE_DECISIONS = [
  {
    id: "gov-dec-101",
    findingId: "pair-ts-stayeasy-hotel",
    decisionType: "Consolidation",
    canonicalApiId: "api-ts-hotel-booking",
    canonicalName: "TravelSphere Hotel Bookings API",
    deprecatedApiId: "api-stayeasy-reserve",
    deprecatedName: "StayEasy Reserve Room API",
    reason: "Consolidation of overlapping hotel reservation logic. StayEasy duplicate route deprecated and redirected to TravelSphere canonical gateway route to eliminate redundant maintenance.",
    approvedBy: "Alice Admin",
    approvedAt: "2026-09-01T14:30:00.000Z",
    migrationNotes: "HTTP 301 gateway rewrite rule deployed on /gateway/stayeasy-reserve -> /gateway/bookings."
  },
  {
    id: "gov-dec-102",
    findingId: "pair-ts-flyfast-flight",
    decisionType: "Formal Governance",
    canonicalApiId: "api-ts-flight-booking",
    canonicalName: "TravelSphere Flight Bookings API",
    deprecatedApiId: "api-flyfast-reserve",
    deprecatedName: "FlyFast Flight Reserve API",
    reason: "Contractual SLA Exemption: Partner airline requires direct IATA NDC XML format compliance for real-time ticket issuance. Both endpoints maintained with automated schema compatibility contract.",
    approvedBy: "Alice Admin",
    approvedAt: "2026-09-02T11:15:00.000Z",
    migrationNotes: "SLA Agreement Ref #SLA-FLYFAST-2026. Bi-weekly schema drift verification scheduled."
  }
];

// Ground Truth Map covering 8 representative pair types
export const GROUND_TRUTH_PAIRS = {
  // 1. Confirmed Duplicate: Hotel Booking (TravelSphere vs StayEasy)
  'api-stayeasy-reserve:api-ts-hotel-booking': { isDuplicate: true, type: 'CONFIRMED_DUPLICATE', description: 'Identical hotel booking business functionality' },
  'api-ts-hotel-booking:api-stayeasy-reserve': { isDuplicate: true, type: 'CONFIRMED_DUPLICATE', description: 'Identical hotel booking business functionality' },

  // 2. Confirmed Duplicate: Payment Processing (TravelSphere vs SecurePay)
  'api-securepay-transactions:api-ts-payment-gateway': { isDuplicate: true, type: 'CONFIRMED_DUPLICATE', description: 'Credit card transaction charging duplication' },
  'api-ts-payment-gateway:api-securepay-transactions': { isDuplicate: true, type: 'CONFIRMED_DUPLICATE', description: 'Credit card transaction charging duplication' },

  // 3. Confirmed Duplicate: Cross-Org Partner Payment (PayLink vs SecurePay)
  'api-paylink-transact:api-securepay-transactions': { isDuplicate: true, type: 'CONFIRMED_DUPLICATE', description: 'Payment processing overlap across partners' },
  'api-securepay-transactions:api-paylink-transact': { isDuplicate: true, type: 'CONFIRMED_DUPLICATE', description: 'Payment processing overlap across partners' },

  // 4. Confirmed Duplicate: Hotel Booking (TravelSphere vs GlobalHotels)
  'api-globalhotels-book:api-ts-hotel-booking': { isDuplicate: true, type: 'CONFIRMED_DUPLICATE', description: 'Partner hotel room booking duplication' },
  'api-ts-hotel-booking:api-globalhotels-book': { isDuplicate: true, type: 'CONFIRMED_DUPLICATE', description: 'Partner hotel room booking duplication' },

  // 5. Semantic Duplicate: Travel Orders vs StayEasy Reservation Mgmt (Different naming, same semantics)
  'api-stayeasy-mgmt:api-ts-travel-orders': { isDuplicate: true, type: 'CONFIRMED_DUPLICATE', description: 'Difficult semantic duplicate with differing tokens' },
  'api-ts-travel-orders:api-stayeasy-mgmt': { isDuplicate: true, type: 'CONFIRMED_DUPLICATE', description: 'Difficult semantic duplicate with differing tokens' },

  // 6. False Positive Control 1: Hotel Booking vs Flight Booking (Shared "booking" token but different domain)
  'api-ts-flight-booking:api-ts-hotel-booking': { isDuplicate: false, type: 'NOT_DUPLICATE', description: 'False positive control: distinct travel verticals' },
  'api-ts-hotel-booking:api-ts-flight-booking': { isDuplicate: false, type: 'NOT_DUPLICATE', description: 'False positive control: distinct travel verticals' },

  // 7. False Positive Control 2: Hotel Search vs Hotel Booking (Query availability vs Transactional booking)
  'api-ts-hotel-booking:api-ts-hotel-search': { isDuplicate: false, type: 'NOT_DUPLICATE', description: 'False positive control: search vs transactional action' },
  'api-ts-hotel-search:api-ts-hotel-booking': { isDuplicate: false, type: 'NOT_DUPLICATE', description: 'False positive control: search vs transactional action' },

  // 8. Overlap Control: Payment Gateway vs Refund Processing (Related financial operations, distinct actions)
  'api-ts-payment-gateway:api-ts-refund-processing': { isDuplicate: false, type: 'NOT_DUPLICATE', description: 'Overlap control: charge vs refund' },
  'api-ts-refund-processing:api-ts-payment-gateway': { isDuplicate: false, type: 'NOT_DUPLICATE', description: 'Overlap control: charge vs refund' }
};

// Helper: Join relational tables into Enriched API representations
export function getEnrichedApis(db) {
  const apis = db.apis || [];
  const endpoints = db.endpoints || [];
  const fields = db.api_fields || [];

  return apis.map(api => {
    const apiEndpoints = endpoints.filter(ep => ep.apiId === api.id);
    const primaryEndpoint = apiEndpoints[0];

    const inputFields = [];
    const outputFields = [];
    const seenInput = new Set();
    const seenOutput = new Set();

    for (const ep of apiEndpoints) {
      const epFields = fields.filter(f => f.endpointId === ep.id);
      for (const f of epFields) {
        if (f.direction === 'output') {
          if (!seenOutput.has(f.name)) {
            seenOutput.add(f.name);
            outputFields.push(f);
          }
        } else {
          if (!seenInput.has(f.name)) {
            seenInput.add(f.name);
            inputFields.push(f);
          }
        }
      }
    }

    return {
      ...api,
      method: (primaryEndpoint && primaryEndpoint.httpMethod) || 'POST',
      endpoints: apiEndpoints,
      primaryEndpoint,
      inputFields,
      outputFields
    };
  });
}

export function getInitialDB() {
  return {
    organisations: DEFAULT_ORGANISATIONS,
    users: DEFAULT_USERS,
    settings: DEFAULT_SETTINGS,
    apis: DEFAULT_APIS,
    endpoints: DEFAULT_ENDPOINTS,
    api_fields: DEFAULT_FIELDS,
    specifications: [],
    duplicate_findings: [],
    field_mappings: [],
    evidence: [],
    governance_decisions: DEFAULT_GOVERNANCE_DECISIONS,
    experiment_runs: [],
    test_results: [],
    audit_logs: [],
    ground_truth_reviews: []
  };
}

export function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    writeDB(getInitialDB());
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      organisations: parsed.organisations || DEFAULT_ORGANISATIONS,
      users: parsed.users || DEFAULT_USERS,
      settings: parsed.settings || DEFAULT_SETTINGS,
      apis: parsed.apis || DEFAULT_APIS,
      endpoints: (parsed.endpoints && parsed.endpoints.length >= DEFAULT_ENDPOINTS.length) ? parsed.endpoints : DEFAULT_ENDPOINTS,
      api_fields: (parsed.api_fields && parsed.api_fields.length >= DEFAULT_FIELDS.length) ? parsed.api_fields : DEFAULT_FIELDS,
      specifications: parsed.specifications || [],
      duplicate_findings: parsed.duplicate_findings || [],
      field_mappings: parsed.field_mappings || [],
      evidence: parsed.evidence || [],
      governance_decisions: (parsed.governance_decisions && parsed.governance_decisions.length > 0) ? parsed.governance_decisions : DEFAULT_GOVERNANCE_DECISIONS,
      experiment_runs: parsed.experiment_runs || [],
      test_results: parsed.test_results || [],
      audit_logs: parsed.audit_logs || [],
      ground_truth_reviews: parsed.ground_truth_reviews || []
    };
  } catch (err) {
    console.error("Error reading DB file, returning initial DB:", err);
    return getInitialDB();
  }
}

export function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing database JSON file", err);
    return false;
  }
}

export function resetDB() {
  const defaultDB = getInitialDB();
  writeDB(defaultDB);
  return defaultDB;
}

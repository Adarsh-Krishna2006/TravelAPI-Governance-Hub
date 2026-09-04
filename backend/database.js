import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, 'db.json');

const DEFAULT_ORGANISATIONS = [
  { id: 'org-ts', name: 'TravelSphere Internal', type: 'Internal', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'org-flyfast', name: 'FlyFast Airlines', type: 'External', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'org-globalhotels', name: 'GlobalHotels', type: 'External', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'org-stayeasy', name: 'StayEasy', type: 'External', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'org-paylink', name: 'PayLink', type: 'External', status: 'Active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'org-securepay', name: 'SecurePay', type: 'External', status: 'Active', createdAt: '2026-01-01T00:00:00Z' }
];

const DEFAULT_USERS = [
  { id: 'usr-admin', name: 'Alice Admin', email: 'admin@travelsphere.demo', role: 'Admin', organisationId: 'org-ts' },
  { id: 'usr-owner', name: 'Bob Owner', email: 'owner@travelsphere.demo', role: 'API Owner', organisationId: 'org-ts' },
  { id: 'usr-partner', name: 'Charlie Partner', email: 'partner@flyfast.demo', role: 'External Partner', organisationId: 'org-flyfast' },
  { id: 'usr-auditor', name: 'Diana Auditor', email: 'auditor@travelsphere.demo', role: 'Auditor', organisationId: 'org-ts' }
];

const DEFAULT_SETTINGS = {
  weights: { route: 20, method: 10, category: 20, fields: 20, semantics: 25, output: 5 },
  thresholds: { high: 85, potential: 65, overlap: 40 }
};

const DEFAULT_APIS = [
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

const DEFAULT_ENDPOINTS = [
  { id: 'ep-ts-hotel-book', apiId: 'api-ts-hotel-booking', path: '/api/v1/bookings', httpMethod: 'POST', description: 'Creates a new hotel booking reservation.', operationId: 'createBooking' },
  { id: 'ep-ts-hotel-get', apiId: 'api-ts-hotel-booking', path: '/api/v1/bookings/{id}', httpMethod: 'GET', description: 'Retrieves booking by ID.', operationId: 'getBookingById' },
  { id: 'ep-ts-hotel-del', apiId: 'api-ts-hotel-booking', path: '/api/v1/bookings/{id}', httpMethod: 'DELETE', description: 'Cancels hotel booking.', operationId: 'cancelBookingById' },
  { id: 'ep-ts-flight-book', apiId: 'api-ts-flight-booking', path: '/api/v1/flight-bookings', httpMethod: 'POST', description: 'Creates a new flight itinerary booking.', operationId: 'createFlightBooking' },
  { id: 'ep-ts-flight-get', apiId: 'api-ts-flight-booking', path: '/api/v1/flight-bookings/{id}', httpMethod: 'GET', description: 'Retrieves flight ticket info.', operationId: 'getFlightBooking' },
  { id: 'ep-ts-res-query', apiId: 'api-ts-res-query', path: '/api/v1/reservations', httpMethod: 'GET', description: 'Queries reservations list.', operationId: 'listReservations' },
  { id: 'ep-ts-cancel', apiId: 'api-ts-cancel-booking', path: '/api/v1/bookings/cancel', httpMethod: 'POST', description: 'Posts cancellation code.', operationId: 'cancelBooking' },
  { id: 'ep-ts-flt-search', apiId: 'api-ts-flight-search', path: '/api/v1/flights/search', httpMethod: 'GET', description: 'Searches flight itineraries.', operationId: 'searchFlights' },
  { id: 'ep-ts-flt-book', apiId: 'api-ts-book-flight', path: '/api/v1/flights/book', httpMethod: 'POST', description: 'Books passenger seats.', operationId: 'bookFlightSeats' },
  { id: 'ep-ts-htl-search', apiId: 'api-ts-hotel-search', path: '/api/v1/hotels/search', httpMethod: 'GET', description: 'Searches hotel rooms.', operationId: 'searchHotels' },
  { id: 'ep-ts-htl-reserve', apiId: 'api-ts-reserve-hotel', path: '/api/v1/hotels/reserve', httpMethod: 'POST', description: 'Reserves room slot.', operationId: 'reserveHotelRoom' },
  { id: 'ep-ts-pay-create', apiId: 'api-ts-payment-gateway', path: '/api/v1/payments', httpMethod: 'POST', description: 'Executes card charge transaction.', operationId: 'processPayment' },
  { id: 'ep-ts-pay-get', apiId: 'api-ts-payment-gateway', path: '/api/v1/payments/{id}', httpMethod: 'GET', description: 'Retrieves payment details.', operationId: 'getPayment' },
  { id: 'ep-ts-refund', apiId: 'api-ts-refund-processing', path: '/api/v1/payments/refund', httpMethod: 'POST', description: 'Refunds payment transaction.', operationId: 'refundPayment' },
  { id: 'ep-ts-pay-status', apiId: 'api-ts-payment-status', path: '/api/v1/payments/status/{txId}', httpMethod: 'GET', description: 'Queries payment status.', operationId: 'getPaymentStatus' },
  { id: 'ep-ts-cust-reg', apiId: 'api-ts-customer-registry', path: '/api/v1/customers/register', httpMethod: 'POST', description: 'Registers customer profile.', operationId: 'registerCustomer' },
  { id: 'ep-ts-cust-prof', apiId: 'api-ts-customer-profile', path: '/api/v1/customers/{id}/profile', httpMethod: 'GET', description: 'Gets customer attributes.', operationId: 'getCustomerProfile' },
  { id: 'ep-ts-orders', apiId: 'api-ts-travel-orders', path: '/api/v1/travel-orders', httpMethod: 'POST', description: 'Creates aggregated travel itinerary order.', operationId: 'createTravelOrder' },
  { id: 'ep-ff-reserve', apiId: 'api-flyfast-reserve', path: '/flyfast/v2/reservations', httpMethod: 'POST', description: 'Places FlyFast flight seat reservation.', operationId: 'flyfastReserve' },
  { id: 'ep-ff-search', apiId: 'api-flyfast-search', path: '/flyfast/v2/flights', httpMethod: 'GET', description: 'Queries FlyFast flight catalogue.', operationId: 'flyfastSearch' },
  { id: 'ep-ff-flyer', apiId: 'api-flyfast-flyer', path: '/flyfast/v2/frequent-flyer', httpMethod: 'POST', description: 'Enrolls in points program.', operationId: 'enrollFlyer' },
  { id: 'ep-ff-passport', apiId: 'api-flyfast-passports', path: '/flyfast/v2/passports', httpMethod: 'POST', description: 'Validates passport data.', operationId: 'verifyPassport' },
  { id: 'ep-gh-book', apiId: 'api-globalhotels-book', path: '/globalhotels/v1/bookings', httpMethod: 'POST', description: 'Confirms guest room booking on GlobalHotels grid.', operationId: 'ghBookRoom' },
  { id: 'ep-gh-query', apiId: 'api-globalhotels-query', path: '/globalhotels/v1/bookings/query/{id}', httpMethod: 'GET', description: 'Fetches GlobalHotels voucher details.', operationId: 'ghQueryRes' },
  { id: 'ep-gh-rates', apiId: 'api-globalhotels-rates', path: '/globalhotels/v1/rates', httpMethod: 'GET', description: 'Queries room rate catalog.', operationId: 'ghSearchRates' },
  { id: 'ep-se-reserve', apiId: 'api-stayeasy-reserve', path: '/api/v1/reservations', httpMethod: 'POST', description: 'StayEasy room space reservation.', operationId: 'stayeasyReserve' },
  { id: 'ep-se-mgmt', apiId: 'api-stayeasy-mgmt', path: '/api/v2/reservation-management', httpMethod: 'POST', description: 'StayEasy stay order management handler.', operationId: 'stayeasyMgmt' },
  { id: 'ep-pl-transact', apiId: 'api-paylink-transact', path: '/paylink/v4/transact', httpMethod: 'POST', description: 'Posts merchant payment charge to PayLink.', operationId: 'paylinkTransact' },
  { id: 'ep-sp-charge', apiId: 'api-securepay-transactions', path: '/api/v2/transactions', httpMethod: 'POST', description: 'Posts card transaction charge to SecurePay.', operationId: 'securepayCharge' }
];

const DEFAULT_FIELDS = [
  { id: 'f-1', endpointId: 'ep-ts-hotel-book', name: 'bookingId', dataType: 'string', required: true, description: 'Unique booking identifier', semanticConcept: 'booking_identifier', format: 'uuid' },
  { id: 'f-2', endpointId: 'ep-ts-hotel-book', name: 'customerId', dataType: 'string', required: true, description: 'Unique customer identifier', semanticConcept: 'customer_identifier', format: 'uuid' },
  { id: 'f-3', endpointId: 'ep-ts-hotel-book', name: 'hotelId', dataType: 'string', required: true, description: 'Unique hotel property identifier', semanticConcept: 'property_identifier', format: 'string' },
  { id: 'f-4', endpointId: 'ep-ts-hotel-book', name: 'bookingDate', dataType: 'string', required: true, description: 'Date booking was created', semanticConcept: 'creation_date', format: 'date' },
  { id: 'f-5', endpointId: 'ep-ts-hotel-book', name: 'checkInDate', dataType: 'string', required: true, description: 'Stay calendar check-in date', semanticConcept: 'check_in_date', format: 'date' },
  { id: 'f-6', endpointId: 'ep-ts-hotel-book', name: 'checkOutDate', dataType: 'string', required: true, description: 'Stay calendar check-out date', semanticConcept: 'check_out_date', format: 'date' },
  { id: 'f-7', endpointId: 'ep-ts-hotel-book', name: 'totalAmount', dataType: 'number', required: true, description: 'Total cost of transaction', semanticConcept: 'monetary_amount', format: 'float' },
  { id: 'f-8', endpointId: 'ep-ts-hotel-book', name: 'currency', dataType: 'string', required: true, description: 'Currency ISO code', semanticConcept: 'currency_code', format: 'string' },
  { id: 'f-9', endpointId: 'ep-se-reserve', name: 'reservation_id', dataType: 'string', required: true, description: 'Unique registration code', semanticConcept: 'booking_identifier', format: 'uuid' },
  { id: 'f-10', endpointId: 'ep-se-reserve', name: 'guest_id', dataType: 'string', required: true, description: 'Unique identifier of guest customer', semanticConcept: 'customer_identifier', format: 'uuid' },
  { id: 'f-11', endpointId: 'ep-se-reserve', name: 'property_id', dataType: 'string', required: true, description: 'Target hotel property identifier', semanticConcept: 'property_identifier', format: 'string' },
  { id: 'f-12', endpointId: 'ep-se-reserve', name: 'reservation_date', dataType: 'string', required: true, description: 'Date stay scheduled', semanticConcept: 'creation_date', format: 'date' },
  { id: 'f-13', endpointId: 'ep-se-reserve', name: 'check_in', dataType: 'string', required: true, description: 'Calendar check-in date', semanticConcept: 'check_in_date', format: 'date' },
  { id: 'f-14', endpointId: 'ep-se-reserve', name: 'check_out', dataType: 'string', required: true, description: 'Calendar check-out date', semanticConcept: 'check_out_date', format: 'date' },
  { id: 'f-15', endpointId: 'ep-se-reserve', name: 'amount', dataType: 'number', required: true, description: 'Total amount paid', semanticConcept: 'monetary_amount', format: 'float' },
  { id: 'f-16', endpointId: 'ep-se-reserve', name: 'currency_code', dataType: 'string', required: true, description: 'ISO Currency notation', semanticConcept: 'currency_code', format: 'string' },
  { id: 'f-17', endpointId: 'ep-ts-pay-create', name: 'paymentId', dataType: 'string', required: true, description: 'Unique payment reference ID', semanticConcept: 'transaction_identifier', format: 'uuid' },
  { id: 'f-18', endpointId: 'ep-ts-pay-create', name: 'customerId', dataType: 'string', required: true, description: 'Payer account identifier', semanticConcept: 'customer_identifier', format: 'uuid' },
  { id: 'f-19', endpointId: 'ep-ts-pay-create', name: 'amount', dataType: 'number', required: true, description: 'Charge total monetary price', semanticConcept: 'monetary_amount', format: 'float' },
  { id: 'f-20', endpointId: 'ep-ts-pay-create', name: 'currency', dataType: 'string', required: true, description: 'ISO Currency code', semanticConcept: 'currency_code', format: 'string' },
  { id: 'f-21', endpointId: 'ep-ts-pay-create', name: 'paymentDate', dataType: 'string', required: true, description: 'Timestamp payment processed', semanticConcept: 'creation_date', format: 'date-time' },
  { id: 'f-22', endpointId: 'ep-ts-pay-create', name: 'status', dataType: 'string', required: true, description: 'Payment clearance state', semanticConcept: 'transaction_status', format: 'string' },
  { id: 'f-23', endpointId: 'ep-sp-charge', name: 'transaction_id', dataType: 'string', required: true, description: 'Unique reference transaction ID', semanticConcept: 'transaction_identifier', format: 'uuid' },
  { id: 'f-24', endpointId: 'ep-sp-charge', name: 'payer_id', dataType: 'string', required: true, description: 'User account identifier', semanticConcept: 'customer_identifier', format: 'uuid' },
  { id: 'f-25', endpointId: 'ep-sp-charge', name: 'total_amount', dataType: 'number', required: true, description: 'Total charge value price', semanticConcept: 'monetary_amount', format: 'float' },
  { id: 'f-26', endpointId: 'ep-sp-charge', name: 'currency_code', dataType: 'string', required: true, description: 'ISO Currency code', semanticConcept: 'currency_code', format: 'string' },
  { id: 'f-27', endpointId: 'ep-sp-charge', name: 'transaction_date', dataType: 'string', required: true, description: 'Date transaction posted', semanticConcept: 'creation_date', format: 'date-time' },
  { id: 'f-28', endpointId: 'ep-sp-charge', name: 'payment_status', dataType: 'string', required: true, description: 'Transaction settlement status', semanticConcept: 'transaction_status', format: 'string' }
];

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

export const DEFAULT_GOVERNANCE_DECISIONS = [
  {
    id: "gov-dec-101",
    findingId: "pair-ts-stayeasy-hotel",
    decisionType: "Consolidation",
    canonicalApiId: "ts-hotel-bookings",
    canonicalName: "TravelSphere Hotel Bookings API",
    deprecatedApiId: "stayeasy-reserve-hotel",
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
    canonicalApiId: "ts-flight-bookings",
    canonicalName: "TravelSphere Flight Bookings API",
    deprecatedApiId: "flyfast-book-flight",
    deprecatedName: "FlyFast Flight Reserve API",
    reason: "Contractual SLA Exemption: Partner airline requires direct IATA NDC XML format compliance for real-time ticket issuance. Both endpoints maintained with automated schema compatibility contract.",
    approvedBy: "Alice Admin",
    approvedAt: "2026-09-02T11:15:00.000Z",
    migrationNotes: "SLA Agreement Ref #SLA-FLYFAST-2026. Bi-weekly schema drift verification scheduled."
  }
];

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
      endpoints: parsed.endpoints || DEFAULT_ENDPOINTS,
      api_fields: parsed.api_fields || DEFAULT_FIELDS,
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

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */
class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */
  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */
  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */
  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */
  // this method either adds new customer or edits existing
  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  // return full name of this customer separated by a space
  fullName() {
    return(`${this.firstName} ${this.lastName}`);
  }

  // search for a customer by name
  static async searchByName(searchString) {
    const results = await db.query(
      `SELECT id, 
        first_name AS "firstName",
        last_name AS "lastName"
        FROM customers
        WHERE CONCAT(first_name, ' ', last_name) ILIKE $1
        ORDER BY last_name, first_name`,
        [`%${searchString}%`]
    );
    return results.rows.map(c => new Customer(c));
  }


  // bestCustomers: return 10 customers who have the most reservations:
        // select c.id, c.first_name, c.last_name, count(r.id) as total_reservations
        // from customers as c
        // join reservations as r on c.id = r.customer_id
        // group by c.last_name, c.first_name, c.id
        // order by count(r.customer_id) desc, c.last_name asc
        // limit 10
  static async bestCustomers() {
    const results = await db.query(
        `SELECT c.id, c.first_name AS "firstName", c.last_name AS "lastName"
        FROM customers as c
        JOIN reservations AS r ON c.id = r.customer_id
        GROUP BY c.last_name, c.first_name, c.id
        ORDER BY COUNT(r.customer_id) DESC, c.last_name ASC
        LIMIT 10`
    );
    return results.rows.map(c => new Customer(c));
  }


}

module.exports = Customer;
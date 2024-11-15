var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');

/**
 * @openapi
 * /rate:
 *   get:
 *     tags:
 *      - rate
 *     description: Gets the list of rates for a partner.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the rates.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idRates:
 *                   type: integer
 *                 idLocation:
 *                   type: integer
 *                 address:
 *                   type: string
 *                 idCurrency:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 date:
 *                   type: string
 *                   format: date-time
 *                 value:
 *                   type: number
 *                   format: double
 *                 success:
 *                   type: boolean
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 success:
 *                   type: boolean
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.get('/', function (req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'No authorization header', success: false });
        return;
    }

    const token = authHeader.split(' ')[1]; // get the token from the Authorization header
    let userId;
    try {
        const decoded = jwt.verify(token, 'exchange-secret-key'); // verify the token
        userId = decoded.id; // get the partner ID from the decoded token
    } catch (err) {
        res.status(401).json({ error: 'Invalid token', success: false });
        return;
    }

    const query = `SELECT rate.idRates, rate.idLocation, location.address, rate.idCurrency, currency.name, rate.date, rate.value  FROM rate
                    INNER JOIN location ON rate.idLocation = location.idLocation
                    INNER JOIN currency ON rate.idCurrency = currency.idCurrency
                    WHERE location.idPartner = ${userId}`;
    req.db.query(query, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message, success: false });
            return;
        }
        res.json({ result, success: true });
    });
});

/**
 * @openapi
 * /rate/insert:
 *   post:
 *     tags:
 *      - rate
 *     description: Add a rate.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idLocation:
 *                 type: integer
 *                 description: Foreign key of the location.
 *               idCurrency:
 *                 type: integer
 *                 description: Foreign key of the currency.
 *               date:
 *                 type: string
 *                 format: date-time
 *               value:
 *                 type: number
 *                 format: double
 *     responses:
 *       200:
 *         description: Rate added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Error caused by an inappropriate input.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 success:
 *                   type: boolean
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 success:
 *                   type: boolean
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.post('/insert', function (req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'No authorization header', success: false });
        return;
    }

    const token = authHeader.split(' ')[1]; // get the token from the Authorization header
    let userId;
    try {
        const decoded = jwt.verify(token, 'exchange-secret-key'); // verify the token
        userId = decoded.id; // get the partner ID from the decoded token
    } catch (err) {
        res.status(401).json({ error: 'Invalid token', success: false });
        return;
    }

    const { idLocation, idCurrency, date, value } = req.body;
    const insertQuery = 'INSERT INTO rate (idLocation, idCurrency, date, value) VALUES (?, ?, ?, ?)';

    console.log(req.body);
    if (!idLocation || !idCurrency || !date || !value) {
        res.status(400).json({ error: 'The request has missing information!', success: false });
        return;
    }
    const formattedDate = new Date(date).toISOString().slice(0, 19).replace('T', ' ');
    req.db.beginTransaction((err) => {
        if (err) {
            res.status(500).json({ error: err.message, success: false });
            return;
        }
        req.db.query(insertQuery, [idLocation, idCurrency, formattedDate, value], (err, result) => {
            if (err) {
                res.status(500).json({ error: err.message, success: false });
                return;
            }
            req.db.commit((err) => {
                if (err) {
                    return req.db.rollback(() => {
                        res.status(500).json({ error: err.message, success: false });
                    });
                }
                res.json({ message: 'Rate added successfully!', success: true });
            });
        });
    });
});

module.exports = router;
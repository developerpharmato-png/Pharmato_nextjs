/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *           default: ""
 *         role:
 *           type: string
 *           enum: ["admin", "customer"]
 *           default: "customer"
 *         title:
 *           type: string
 *           default: ""
 *         message:
 *           type: string
 *           default: ""
 *         type:
 *           type: string
 *           default: ""
 *         targetScreen:
 *           type: string
 *           default: ""
 *         targetId:
 *           type: string
 *           default: ""
 *         isRead:
 *           type: boolean
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         readAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         meta:
 *           type: object
 *           default: {}
 */

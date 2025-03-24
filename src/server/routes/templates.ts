/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Get all templates
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of templates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Template'
 * 
 * components:
 *   schemas:
 *     Template:
 *       type: object
 *       required:
 *         - name
 *         - subject_name
 *         - topic_name
 *         - subtopic_name
 *         - difficulty_level
 *         - question_format
 *         - options_format
 *         - solution_format
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           description: Template name
 *         description:
 *           type: string
 *           description: Optional template description
 *         subject_name:
 *           type: string
 *           description: Subject from LVNPLUS master data
 *         topic_name:
 *           type: string
 *           description: Topic from LVNPLUS master data
 *         subtopic_name:
 *           type: string
 *           description: Subtopic from LVNPLUS master data
 *         difficulty_level:
 *           type: integer
 *           minimum: 0
 *           maximum: 5
 *           description: Question difficulty level
 *         question_format:
 *           type: string
 *           description: Format specification for question generation
 *         options_format:
 *           type: string
 *           description: Format specification for answer options
 *         solution_format:
 *           type: string
 *           description: Format specification for solution explanation
 *         example_question:
 *           type: string
 *           description: Optional example question following the template format
 */

export * from '../templates';
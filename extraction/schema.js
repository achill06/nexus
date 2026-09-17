const { z } = require('zod');

const ListingSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string(),
  remote_ok: z.enum(['yes', 'no', 'not_specified']),
  stipend: z.string().nullish(),
  required_skills: z.array(z.string()),
  experience_level: z.enum(['intern','entry','mid','senior']),
  deadline: z.string().nullish(),
});

module.exports = { ListingSchema };
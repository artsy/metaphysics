import {
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { unescapeEntities } from "lib/helpers"
import { ResolverContext } from "types/graphql"
import { date } from "./fields/date"

interface Job {
  absolute_url: string
  content: string | null
  internal_job_id: number | null
  location: { name: string }
  metadata: any[]
  id: number
  updated_at: string
  requisition_id: null | string
  title: string
  departments: { name: string }[]
}

export const jobType = new GraphQLObjectType<Job, ResolverContext>({
  name: "Job",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
    externalURL: {
      description: "The url of the job listing on Greenhouse",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ absolute_url }) => absolute_url,
    },
    content: {
      description: "HTML of job listing",
      type: new GraphQLNonNull(GraphQLString),
      resolve: async ({ id, content }, _args, { jobLoader }) => {
        let html = content

        if (!html) {
          const job = await jobLoader(`${id}`)
          html = job.content as string
        }

        return unescapeEntities(html)
      },
    },
    updatedAt: date(({ updated_at }) => updated_at),
    location: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ location }) => location.name,
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
    },
    departmentName: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ departments }) => {
        return departments
          .map((department) => department.name)
          .join(", ")
          .replace(/\s\d.+/, "")
      },
    },
  },
})

export const job: GraphQLFieldConfig<void, ResolverContext> = {
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  type: new GraphQLNonNull(jobType),
  resolve: (_source, { id }, { jobLoader }) => {
    return jobLoader(id)
  },
}

export const jobs: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(jobType))),
  resolve: async (_source, _args, { jobsLoader }) => {
    const { jobs } = (await jobsLoader()) as {
      jobs: Job[]
      meta: { total: number }
    }

    return jobs
  },
}

interface Department {
  id: number
  name: string
  jobs: Job[]
}

export const departmentType = new GraphQLObjectType<
  Department,
  ResolverContext
>({
  name: "Department",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ name }) => {
        // Remove department numbers
        return name.replace(/\s\d.+/, "")
      },
    },
    jobs: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(jobType))),
    },
  },
})

export const departments: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(departmentType))),
  resolve: async (_source, _args, { departmentsLoader }) => {
    const { departments } = (await departmentsLoader()) as {
      departments: Department[]
    }

    return departments
  },
}

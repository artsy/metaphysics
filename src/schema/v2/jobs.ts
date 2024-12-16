import {
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { date } from "./fields/date"
import { ashby } from "lib/apis/ashby"

interface JobListing {
  id: string
  title: string
  jobID: string
  departmentName: string
  teamName: string
  locationName: string
  employmentType: string
  isListed: boolean
  publishedDate: string
  applicationDeadline: string | null
  externalLink: string
  applyLink: string
  locationIDS: string[]
  compensationTierSummary: string
  shouldDisplayCompensationOnJobBoard: boolean
  updatedAt: string
}

interface JobInfo {
  id: string
  title: string
  descriptionPlain: string
  descriptionHtml: string
  descriptionSocial: null
  descriptionParts: {
    descriptionOpening: null
    descriptionBody: {
      html: string
      plain: string
    }
    descriptionClosing: {
      html: string
      plain: string
    }
  }
  departmentName: string
  teamName: string
  teamNameHierarchy: string[]
  jobID: string
  locationName: string
  locationIDS: {
    primaryLocationID: string
    secondaryLocationIDS: any[]
  }
  publishedDate: string
  applicationDeadline: null
  isRemote: null
  employmentType: string
  isListed: boolean
  externalLink: string
  applyLink: string
  updatedAt: string
}

export const jobType = new GraphQLObjectType<
  JobListing | JobInfo,
  ResolverContext
>({
  name: "Job",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
    externalURL: {
      description: "The url of the job listing on Greenhouse",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ externalLink }) => externalLink,
    },
    content: {
      description: "HTML of job listing",
      type: new GraphQLNonNull(GraphQLString),
      resolve: async (job) => {
        if ("descriptionHtml" in job) {
          return job.descriptionHtml
        }

        if ("id" in job) {
          const response = await ashby("jobPosting.info", {
            body: { jobPostingId: job.id },
          })
          return response.results.descriptionHtml
        }

        throw new Error("Not found")
      },
    },
    updatedAt: date(({ updatedAt }) => updatedAt),
    location: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ locationName }) => locationName,
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
    },
    departmentName: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ departmentName }) => departmentName,
    },
  },
})

export const job: GraphQLFieldConfig<void, ResolverContext> = {
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  type: new GraphQLNonNull(jobType),
  resolve: async (_source, { id }) => {
    const { results } = await ashby("jobPosting.info", {
      body: { jobPostingId: id },
    })
    return results
  },
}

export const jobs: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(jobType))),
  resolve: async (_source, _args) => {
    const { results } = await ashby("jobPosting.list")
    return results
  },
}

interface Department {
  id: string
  name: string
  isArchived: boolean
  parentID: string | null
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
      deprecationReason: "No longer supported",
      resolve: () => {
        return []
      },
    },
  },
})

export const departments: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(departmentType))),
  resolve: async (_source, _args) => {
    const { results } = await ashby("department.list")
    return results
  },
}

# frozen_string_literal: true

projects = [
  { name: 'causality', schema_path: 'src/main/resources/rendered.graphql' },
  { name: 'convection', schema_path: '_schema.graphql' },
  { name: 'diffusion', schema_path: '_schema.graphql' },
  { name: 'exchange', schema_path: '_schema.graphql' },
  { name: 'gravity', schema_path: '_schema.graphql' },
  { name: 'kaws', schema_path: '_schema.graphql' },
  { name: 'positron', schema_path: 'data/schema.graphql' },
  { name: 'vortex', schema_path: '_schema.graphql' }
]

projects.each do |project|
  target_path = "../#{project[:name]}/#{project[:schema_path]}"
  data_path = "src/data/#{project[:name]}.graphql"
  `cp #{target_path} #{data_path}`
end

# Creating a Metaphysics Review App

Simply push a commit to a branch with `review-app-` in the name (eg: `review-app-hello-world`). CircleCI will match the `review-app-` prefix and either automatically create or update a review app.

CircleCI executes the following scripts to achieve it:

1. [build_review_app.sh](../scripts/build_review_app.sh) or [update_review_app.sh](../scripts/update_review_app.sh) - Creates or updates the Kubernetes review app (depending on whether the namespace already exists)
2. [create-review-app-subdomain.js](../scripts/create-review-app-subdomain.js) - Creates the Cloudflare DNS CNAME record for the review app subdomain

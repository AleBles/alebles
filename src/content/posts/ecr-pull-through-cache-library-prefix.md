---
title: "ECR Pull-Through Cache: The 'library/' prefix that will cost you an hour"
date: 2026-04-17
linkedinUrl: https://www.linkedin.com/posts/alebles_devops-docker-opensource-activity-7450473554057428992-Ecsb
excerpt: "An hour of debugging CI, one missing word in the image reference: 'library/'. The fix is trivial once you know, but the real story is bigger than a missing prefix."
---

Short version: AWS ECR's pull-through cache rewrites upstream Docker Hub paths, and official images live under the `library/` namespace. Forget to include that prefix in your image reference and CI spends an hour failing in ways the error messages don't quite explain.

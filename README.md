1. Rename images in infra/k8s/*.yaml
2. `kubectl secret generic jwt-secret --from-literal=JWT_KEY={secret}`
3. `kubectl secret generic stripe-secret --from-literal=STRIPE_API_KEY={secret}`
4. Rename images in skaffold.yaml
5. `skaffold dev`

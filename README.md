1. Rename images in infra/k8s/*.yaml
2. `kubectl secret generic jwt-secret --from-literal=JWT_KEY={secret}`
3. Rename images in skaffold.yaml
4. `skaffold dev`

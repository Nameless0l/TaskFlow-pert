export class PERTAlgorithm {
  constructor(tasks) {
    this.tasks = tasks;
    this.nodes = new Map();
    this.edges = [];
    this.criticalPath = [];
  }

  calculate() {
    this.buildNetwork();
    this.calculateEarliestTimes();
    this.calculateLatestTimes();
    this.calculateSlacks();
    this.findCriticalPath();

    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      criticalPath: this.criticalPath,
      projectDuration: this.getProjectDuration(),
    };
  }

  buildNetwork() {
    let nodeCounter = 1;

    // Créer le nœud de début
    this.nodes.set("start", {
      id: "start",
      nodeNumber: 0,
      name: "Début",
      earliestTime: 0,
      latestTime: 0,
      slack: 0,
      isCritical: false,
    });

    // Créer uniquement les nœuds nécessaires (après chaque tâche)
    this.tasks.forEach((task) => {
      const nodeId = `after_${task.id}`;
      if (!this.nodes.has(nodeId)) {
        this.nodes.set(nodeId, {
          id: nodeId,
          nodeNumber: nodeCounter++,
          name: `Après ${task.id}`,
          earliestTime: 0,
          latestTime: 0,
          slack: 0,
          isCritical: false,
        });
      }
    });

    // Créer le nœud de fin
    this.nodes.set("end", {
      id: "end",
      nodeNumber: nodeCounter++,
      name: "Fin",
      earliestTime: 0,
      latestTime: 0,
      slack: 0,
      isCritical: false,
    });

    // Créer les arêtes pour les tâches
    this.tasks.forEach((task) => {
      if (task.dependencies.length === 0) {
        // Tâche sans dépendance : part du début
        this.edges.push({
          from: "start",
          to: `after_${task.id}`,
          task: task,
          duration: task.duration,
          isDummy: false,
          isCritical: false,
        });
      } else if (task.dependencies.length === 1) {
        // Une seule dépendance : liaison directe
        this.edges.push({
          from: `after_${task.dependencies[0]}`,
          to: `after_${task.id}`,
          task: task,
          duration: task.duration,
          isDummy: false,
          isCritical: false,
        });
      } else {
        // Plusieurs dépendances : créer un nœud de convergence
        const convergenceNodeId = `conv_${task.id}`;
        this.nodes.set(convergenceNodeId, {
          id: convergenceNodeId,
          nodeNumber: nodeCounter++,
          name: `Conv`,
          earliestTime: 0,
          latestTime: 0,
          slack: 0,
          isCritical: false,
        });

        // Arêtes fictives des dépendances vers le nœud de convergence
        task.dependencies.forEach((depId) => {
          this.edges.push({
            from: `after_${depId}`,
            to: convergenceNodeId,
            task: null,
            duration: 0,
            isDummy: true,
            isCritical: false,
          });
        });

        // Arête de la tâche depuis la convergence
        this.edges.push({
          from: convergenceNodeId,
          to: `after_${task.id}`,
          task: task,
          duration: task.duration,
          isDummy: false,
          isCritical: false,
        });
      }
    });

    // Connecter les tâches finales au nœud de fin
    const finalTasks = this.tasks.filter(
      (task) => !this.tasks.some((t) => t.dependencies.includes(task.id))
    );

    // Connecter directement chaque tâche finale au nœud de fin (sans convergence intermédiaire)
    finalTasks.forEach((task) => {
      this.edges.push({
        from: `after_${task.id}`,
        to: "end",
        task: null,
        duration: 0,
        isDummy: true,
        isCritical: false,
      });
    });
  }

  calculateEarliestTimes() {
    const visited = new Set();

    const calculate = (nodeId) => {
      if (visited.has(nodeId)) return this.nodes.get(nodeId)?.earliestTime || 0;

      visited.add(nodeId);
      const node = this.nodes.get(nodeId);

      if (!node) return 0;

      if (nodeId === "start") {
        node.earliestTime = 0;
        return 0;
      }

      let maxEarliest = 0;
      this.edges.forEach((edge) => {
        if (edge.to === nodeId) {
          const fromEarliest = calculate(edge.from);
          maxEarliest = Math.max(maxEarliest, fromEarliest + edge.duration);
        }
      });

      node.earliestTime = maxEarliest;
      return maxEarliest;
    };

    this.nodes.forEach((node, nodeId) => {
      calculate(nodeId);
    });
  }

  calculateLatestTimes() {
    const endNode = this.nodes.get("end");
    if (!endNode) return;

    const projectDuration = endNode.earliestTime;
    endNode.latestTime = projectDuration;

    const visited = new Set();

    const calculate = (nodeId) => {
      if (visited.has(nodeId)) return this.nodes.get(nodeId)?.latestTime || 0;

      visited.add(nodeId);
      const node = this.nodes.get(nodeId);

      if (!node) return 0;

      if (nodeId === "end") {
        return node.latestTime;
      }

      let minLatest = Infinity;
      this.edges.forEach((edge) => {
        if (edge.from === nodeId) {
          const toLatest = calculate(edge.to);
          minLatest = Math.min(minLatest, toLatest - edge.duration);
        }
      });

      node.latestTime = minLatest === Infinity ? node.earliestTime : minLatest;
      return node.latestTime;
    };

    this.nodes.forEach((node, nodeId) => {
      calculate(nodeId);
    });
  }

  calculateSlacks() {
    this.nodes.forEach((node) => {
      node.slack = node.latestTime - node.earliestTime;
      node.isCritical = node.slack === 0;
    });

    this.edges.forEach((edge) => {
      const fromNode = this.nodes.get(edge.from);
      const toNode = this.nodes.get(edge.to);
      if (fromNode && toNode) {
        const totalSlack =
          toNode.latestTime - fromNode.earliestTime - edge.duration;
        edge.slack = totalSlack;
        edge.isCritical = totalSlack === 0;
      }
    });
  }

  findCriticalPath() {
    this.criticalPath = [];

    const findPath = (currentNode, path) => {
      if (currentNode === "end") {
        this.criticalPath = [...path];
        return true;
      }

      for (const edge of this.edges) {
        if (edge.from === currentNode && edge.isCritical) {
          if (findPath(edge.to, [...path, edge])) {
            return true;
          }
        }
      }

      return false;
    };

    findPath("start", []);
  }

  getProjectDuration() {
    const endNode = this.nodes.get("end");
    return endNode ? endNode.earliestTime : 0;
  }

  getTaskMetrics() {
    return this.tasks.map((task) => {
      const taskEdge = this.edges.find((e) => e.task && e.task.id === task.id);
      const fromNode = taskEdge ? this.nodes.get(taskEdge.from) : null;
      const toNode = taskEdge ? this.nodes.get(taskEdge.to) : null;

      return {
        id: task.id,
        name: task.name,
        duration: task.duration,
        earliestStart: fromNode ? fromNode.earliestTime : 0,
        latestStart: fromNode ? fromNode.latestTime : 0,
        earliestFinish: toNode ? toNode.earliestTime : 0,
        latestFinish: toNode ? toNode.latestTime : 0,
        totalSlack: fromNode ? fromNode.slack : 0,
        freeSlack: this.calculateFreeSlack(task.id),
        isCritical: taskEdge ? taskEdge.isCritical : false,
      };
    });
  }

  calculateFreeSlack(taskId) {
    const taskEdge = this.edges.find((e) => e.task && e.task.id === taskId);
    if (!taskEdge) return 0;

    const toNode = this.nodes.get(taskEdge.to);
    if (!toNode) return 0;

    let minSuccessorStart = Infinity;

    this.edges.forEach((edge) => {
      if (edge.from === taskEdge.to) {
        const successorNode = this.nodes.get(edge.to);
        if (successorNode) {
          minSuccessorStart = Math.min(
            minSuccessorStart,
            successorNode.earliestTime
          );
        }
      }
    });

    return minSuccessorStart === Infinity
      ? 0
      : minSuccessorStart - toNode.earliestTime;
  }

  // Méthodes utilitaires pour l'affichage

  /**
   * Calcule les positions des nœuds pour un layout compact
   * Optimise l'utilisation de l'espace vertical en fonction des connexions
   * @returns {Map} Map des positions des nœuds {x, y}
   */
  calculateNodePositions() {
    const positions = new Map();
    const levels = new Map();

    // Calculer les niveaux (distance maximale depuis le début)
    const calculateLevel = (nodeId, level = 0) => {
      const currentLevel = levels.get(nodeId);
      if (currentLevel !== undefined && currentLevel >= level)
        return currentLevel;

      levels.set(nodeId, Math.max(currentLevel || 0, level));

      this.edges.forEach((edge) => {
        if (edge.from === nodeId) {
          calculateLevel(edge.to, level + 1);
        }
      });

      return levels.get(nodeId);
    };

    calculateLevel("start");

    // Grouper par niveau
    const nodesByLevel = new Map();
    levels.forEach((level, nodeId) => {
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level).push(nodeId);
    });

    const totalLevels = nodesByLevel.size;
    const maxNodesInLevel = Math.max(
      ...Array.from(nodesByLevel.values()).map((n) => n.length)
    );

    // Hauteur et espacements
    const targetHeight = Math.max(400, maxNodesInLevel * 100);
    const levelSpacing = 120;
    const nodeSpacing = 80;
    const startX = 50;
    const startY = 50;

    // Première passe : positionner le premier niveau (start)
    const sortedLevels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);

    sortedLevels.forEach((level, levelIndex) => {
      const nodes = nodesByLevel.get(level);

      if (level === 0) {
        // Premier niveau : centrer verticalement
        const levelHeight = (nodes.length - 1) * nodeSpacing;
        const offsetY = (targetHeight - levelHeight) / 2;
        nodes.forEach((nodeId, index) => {
          positions.set(nodeId, {
            x: startX + level * levelSpacing,
            y: startY + offsetY + index * nodeSpacing,
          });
        });
      } else {
        // Autres niveaux : positionner en fonction des prédécesseurs
        const nodePositions = [];

        nodes.forEach((nodeId) => {
          // Trouver tous les prédécesseurs de ce nœud
          const predecessors = this.edges
            .filter((e) => e.to === nodeId)
            .map((e) => e.from);

          // Calculer la position Y moyenne des prédécesseurs
          let avgY = 0;
          let count = 0;
          predecessors.forEach((predId) => {
            const predPos = positions.get(predId);
            if (predPos) {
              avgY += predPos.y;
              count++;
            }
          });

          if (count > 0) {
            avgY = avgY / count;
          } else {
            avgY = targetHeight / 2 + startY;
          }

          nodePositions.push({ nodeId, targetY: avgY });
        });

        // Trier par position Y cible
        nodePositions.sort((a, b) => a.targetY - b.targetY);

        // Assigner les positions en évitant les chevauchements
        const minSpacing = nodeSpacing;
        let lastY = -Infinity;

        nodePositions.forEach(({ nodeId, targetY }, index) => {
          let y = targetY;

          // Éviter le chevauchement avec le nœud précédent
          if (y < lastY + minSpacing) {
            y = lastY + minSpacing;
          }

          positions.set(nodeId, {
            x: startX + level * levelSpacing,
            y: y,
          });

          lastY = y;
        });
      }
    });

    const allY = Array.from(positions.values()).map((p) => p.y);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);
    const graphHeight = maxY - minY;
    const offsetToCenter = (targetHeight - graphHeight) / 2 + startY - minY;

    if (offsetToCenter > 0) {
      positions.forEach((pos, nodeId) => {
        pos.y += offsetToCenter / 2;
      });
    }

    return positions;
  }

  /**
   * Retourne les dimensions recommandées pour le SVG
   * @param {Map} positions - Positions des nœuds
   * @returns {Object} {width, height}
   */
  getSVGDimensions(positions) {
    const xValues = Array.from(positions.values()).map((p) => p.x);
    const yValues = Array.from(positions.values()).map((p) => p.y);

    const maxX = Math.max(...xValues);
    const maxY = Math.max(...yValues);

    return {
      width: maxX + 80,
      height: maxY + 70,
    };
  }

  /**
   * Exporte les données complètes du PERT
   * @returns {Object} Toutes les données calculées
   */
  exportData() {
    const result = this.calculate();
    return {
      ...result,
      taskMetrics: this.getTaskMetrics(),
      nodePositions: this.calculateNodePositions(),
      svgDimensions: this.getSVGDimensions(this.calculateNodePositions()),
    };
  }
}

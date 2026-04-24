import React, { createContext, useContext, useEffect, useState } from 'react';
import { getRuntime, type IRuntime } from '../runtime/QRuntime';
import { Logger } from '../services/Logger';
import type { IAgentCore } from '../contracts/AgentContracts';
import type { IPermissionLayer } from '../contracts/SecurityContracts';
import type { IMemoryEngine } from '../contracts/MemoryContracts';
import type { IToolRegistry } from '../contracts/ToolContracts';

interface AgentContextType {
  runtime: IRuntime | null;
  agentCore: IAgentCore | null;
  permission: IPermissionLayer | null;
  memory: IMemoryEngine | null;
  tools: IToolRegistry | null;
  logger: Logger;
  isLoading: boolean;
  error: Error | null;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [runtime, setRuntime] = useState<IRuntime | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const logger = new Logger();

  useEffect(() => {
    try {
      const rt = getRuntime();
      setRuntime(rt);
      logger.info('AgentProvider: Runtime initialized', { runtimeId: rt?.id });
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      logger.error('AgentProvider: Failed to initialize runtime', { error: e.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AgentContextType = {
    runtime,
    agentCore: runtime?.agentCore || null,
    permission: runtime?.permissionLayer || null,
    memory: runtime?.memoryEngine || null,
    tools: runtime?.toolRegistry || null,
    logger,
    isLoading,
    error,
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = (): AgentContextType => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within AgentProvider');
  }
  return context;
};

export const useAgentCore = () => {
  const { agentCore } = useAgent();
  return agentCore;
};

export const usePermission = () => {
  const { permission } = useAgent();
  return permission;
};

export const useMemory = () => {
  const { memory } = useAgent();
  return memory;
};

export const useTools = () => {
  const { tools } = useAgent();
  return tools;
};

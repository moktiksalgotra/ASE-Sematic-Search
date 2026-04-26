import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { cn } from "../../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const WorkspaceContext = React.createContext(null);

function useWorkspaceContext() {
  const context = React.useContext(WorkspaceContext);
  if (!context) {
    throw new Error("Workspace components must be used within WorkspaceProvider");
  }
  return context;
}

function Workspaces({
  children,
  workspaces,
  selectedWorkspaceId,
  onWorkspaceChange,
  open: controlledOpen,
  onOpenChange,
  getWorkspaceId = (workspace) => workspace.id,
  getWorkspaceName = (workspace) => workspace.name
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const selectedWorkspace = React.useMemo(() => {
    if (!selectedWorkspaceId) return workspaces[0];
    return workspaces.find((ws) => getWorkspaceId(ws) === selectedWorkspaceId) || workspaces[0];
  }, [workspaces, selectedWorkspaceId, getWorkspaceId]);

  const handleWorkspaceSelect = React.useCallback(
    (workspace) => {
      onWorkspaceChange?.(workspace);
      setOpen(false);
    },
    [onWorkspaceChange, setOpen]
  );

  const value = {
    open,
    setOpen,
    selectedWorkspace,
    workspaces,
    onWorkspaceSelect: handleWorkspaceSelect,
    getWorkspaceId,
    getWorkspaceName
  };

  return (
    <WorkspaceContext.Provider value={value}>
      <Popover open={open} onOpenChange={setOpen}>
        {children}
      </Popover>
    </WorkspaceContext.Provider>
  );
}

function WorkspaceTrigger({ className, renderTrigger, ...props }) {
  const { open, selectedWorkspace, getWorkspaceName } = useWorkspaceContext();

  if (!selectedWorkspace) return null;

  if (renderTrigger) {
    return (
      <PopoverTrigger asChild>
        <button className={className} {...props}>
          {renderTrigger(selectedWorkspace, open)}
        </button>
      </PopoverTrigger>
    );
  }

  return (
    <PopoverTrigger asChild>
      <button
        data-state={open ? "open" : "closed"}
        className={cn(
          "flex h-12 w-full max-w-80 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-[#002147]/40",
          "hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={selectedWorkspace.logo} alt={getWorkspaceName(selectedWorkspace)} />
            <AvatarFallback className="text-xs">
              {getWorkspaceName(selectedWorkspace).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{getWorkspaceName(selectedWorkspace)}</span>
        </div>
        <ChevronsUpDownIcon className="h-4 w-4 shrink-0 opacity-50" />
      </button>
    </PopoverTrigger>
  );
}

function WorkspaceContent({ className, children, renderWorkspace, title = "Workspaces", searchable = false, onSearch, ...props }) {
  const { workspaces, selectedWorkspace, onWorkspaceSelect, getWorkspaceId, getWorkspaceName } = useWorkspaceContext();
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredWorkspaces = React.useMemo(() => {
    if (!searchQuery) return workspaces;
    return workspaces.filter((ws) => getWorkspaceName(ws).toLowerCase().includes(searchQuery.toLowerCase()));
  }, [workspaces, searchQuery, getWorkspaceName]);

  React.useEffect(() => {
    onSearch?.(searchQuery);
  }, [searchQuery, onSearch]);

  const defaultRenderWorkspace = (workspace, isSelected) => (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Avatar className="h-6 w-6">
        <AvatarImage src={workspace.logo} alt={getWorkspaceName(workspace)} />
        <AvatarFallback className="text-xs">{getWorkspaceName(workspace).charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <span className="truncate text-sm">{getWorkspaceName(workspace)}</span>
        {workspace.plan && <span className="text-xs text-slate-500">{workspace.plan}</span>}
      </div>
      {isSelected && <CheckIcon className="ml-auto h-4 w-4" />}
    </div>
  );

  return (
    <PopoverContent className={cn("p-0", className)} align={props.align || "start"} {...props}>
      <div className="border-b border-slate-100 px-3 py-2">
        <p className="text-sm font-medium text-slate-500">{title}</p>
      </div>

      {searchable && (
        <div className="border-b border-slate-100 px-3 py-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      )}

      <div className="max-h-[300px] overflow-y-auto">
        {filteredWorkspaces.length === 0 ? (
          <div className="px-3 py-2 text-center text-sm text-slate-500">No options found</div>
        ) : (
          <div className="p-1">
            {filteredWorkspaces.map((workspace) => {
              const isSelected = selectedWorkspace && getWorkspaceId(selectedWorkspace) === getWorkspaceId(workspace);
              return (
                <button
                  key={getWorkspaceId(workspace)}
                  onClick={() => onWorkspaceSelect(workspace)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm",
                    "hover:bg-slate-100 focus:outline-none",
                    isSelected && "bg-slate-100"
                  )}
                >
                  {renderWorkspace ? renderWorkspace(workspace, !!isSelected) : defaultRenderWorkspace(workspace, !!isSelected)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {children && (
        <>
          <div className="border-t border-slate-100" />
          <div className="p-1">{children}</div>
        </>
      )}
    </PopoverContent>
  );
}

export { Workspaces, WorkspaceTrigger, WorkspaceContent };

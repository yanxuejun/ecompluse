import React, { useState, useEffect, useRef } from "react";

interface CategoryNode {
  code: string;
  catalog_name: string;
  children?: CategoryNode[];
}

interface Props {
  value: string | string[] | null;
  onChange: (code: string | string[], node?: CategoryNode | CategoryNode[]) => void;
  placeholder?: string;
  className?: string;
  multiple?: boolean;
}

export default function CategoryTreeSelect({ value, onChange, placeholder = "请选择类目", className = "", multiple = false }: Props) {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [dropdown, setDropdown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/categories.json")
      .then(res => res.json())
      .then(setTree);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdown(false);
      }
    }
    if (dropdown) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdown]);

  function filterTree(nodes: CategoryNode[]): CategoryNode[] {
    if (!search) return nodes;
    return nodes
      .map(node => {
        if (node.catalog_name.toLowerCase().includes(search.toLowerCase()) || (typeof value === 'string' && node.code === value) || (Array.isArray(value) && value.includes(node.code))) {
          return node;
        }
        if (node.children) {
          const filtered = filterTree(node.children);
          if (filtered.length) return { ...node, children: filtered };
        }
        return null;
      })
      .filter(Boolean) as CategoryNode[];
  }

  function isChecked(code: string) {
    if (multiple && Array.isArray(value)) return value.includes(code);
    return value === code;
  }

  function renderTree(nodes: CategoryNode[], depth = 0) {
    return (
      <ul className={depth === 0 ? "max-h-80 overflow-auto" : ""}>
        {nodes.map(node => (
          <li key={node.code}>
            <div
              className={`flex items-center px-2 py-1 cursor-pointer hover:bg-blue-100 rounded ${isChecked(node.code) ? "bg-blue-600 text-white" : ""}`}
              style={{ paddingLeft: 16 * depth }}
              onClick={e => {
                e.stopPropagation();
                if (multiple) {
                  let newValue = Array.isArray(value) ? [...value] : [];
                  if (newValue.includes(node.code)) {
                    newValue = newValue.filter(c => c !== node.code);
                  } else {
                    newValue.push(node.code);
                  }
                  onChange(newValue);
                } else {
                  onChange(node.code, node);
                  setDropdown(false);
                }
              }}
            >
              {multiple && (
                <input
                  type="checkbox"
                  checked={isChecked(node.code)}
                  readOnly
                  className="mr-2"
                />
              )}
              {node.children && node.children.length > 0 && (
                <span
                  className="mr-1 select-none"
                  onClick={e => {
                    e.stopPropagation();
                    setExpanded(exp => ({ ...exp, [node.code]: !exp[node.code] }));
                  }}
                >
                  {expanded[node.code] ? "▼" : "▶"}
                </span>
              )}
              <span>{node.catalog_name}</span>
            </div>
            {node.children && node.children.length > 0 && expanded[node.code] && renderTree(node.children, depth + 1)}
          </li>
        ))}
      </ul>
    );
  }

  let selectedLabel = placeholder;
  if (multiple && Array.isArray(value) && value.length > 0) {
    selectedLabel = `已选${value.length}项`;
  } else if (!multiple && typeof value === 'string' && value) {
    // 可选：显示选中项名称
    const findLabel = (nodes: CategoryNode[]): string | null => {
      for (const node of nodes) {
        if (node.code === value) return node.catalog_name;
        if (node.children) {
          const found = findLabel(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    selectedLabel = findLabel(tree) || placeholder;
  }

  return (
    <div className={`relative w-full ${className}`} ref={ref}>
      <div
        className="border px-2 py-1 rounded bg-white cursor-pointer"
        onClick={() => setDropdown(d => !d)}
      >
        {selectedLabel}
      </div>
      {dropdown && (
        <div className="absolute z-20 bg-white border rounded shadow w-full min-w-[320px] mt-1">
          <input
            className="w-full border-b px-2 py-1"
            placeholder="请输入关键字进行过滤"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="max-h-80 overflow-auto">{renderTree(filterTree(tree))}</div>
        </div>
      )}
    </div>
  );
} 
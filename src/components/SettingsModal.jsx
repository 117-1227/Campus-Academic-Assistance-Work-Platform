import { useState, useEffect } from 'react'
import Modal from './Modal'
import { getAll, setAll, reset } from '../utils/config'

export default function SettingsModal({ isOpen, onClose }) {
  const [remoteUrl, setRemoteUrl] = useState('')
  const [localUrl, setLocalUrl] = useState('')
  const [useLocal, setUseLocal] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const cfg = getAll()
      setRemoteUrl(cfg.remoteUrl)
      setLocalUrl(cfg.localUrl)
      setUseLocal(cfg.useLocal)
      setSaved(false)
    }
  }, [isOpen])

  function handleSave() {
    setAll({ remoteUrl, localUrl, useLocal })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const activeUrl = useLocal ? localUrl : remoteUrl
  const activeLabel = useLocal ? '本地' : '远程'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="服务器设置"
      footer={
        <>
          <button onClick={() => { reset(); const c = getAll(); setRemoteUrl(c.remoteUrl); setLocalUrl(c.localUrl); setUseLocal(c.useLocal) }} className="btn-8pt text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 mr-auto text-xs">恢复默认</button>
          <button onClick={onClose} className="btn-8pt text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">取消</button>
          <button onClick={handleSave} className="btn-8pt text-white bg-indigo-600 hover:bg-indigo-700">
            {saved ? '已保存' : '保存'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Current mode indicator */}
        <div className="flex items-center gap-3 p-3 rounded-lg border text-sm bg-emerald-50 border-emerald-200 text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>当前：<strong>{activeLabel}服务器</strong> — {activeUrl || 'Vite 代理'}</span>
        </div>

        {/* Remote server */}
        <div>
          <label className="flex items-center gap-2 mb-2 cursor-pointer">
            <input type="radio" name="env" checked={!useLocal} onChange={() => setUseLocal(false)} className="shrink-0" />
            <span className="text-sm font-medium text-gray-700">远程服务器</span>
            <span className="text-xs text-gray-400">（后端在别人机器上）</span>
          </label>
          <input
            type="text" value={remoteUrl}
            onChange={(e) => { setRemoteUrl(e.target.value); setUseLocal(false) }}
            placeholder="http://192.168.10.100:3000"
            className="w-full h-10 px-3 ml-6 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            style={{ width: 'calc(100% - 24px)' }}
          />
        </div>

        {/* Local server */}
        <div>
          <label className="flex items-center gap-2 mb-2 cursor-pointer">
            <input type="radio" name="env" checked={useLocal} onChange={() => setUseLocal(true)} className="shrink-0" />
            <span className="text-sm font-medium text-gray-700">本地服务器</span>
            <span className="text-xs text-gray-400">（后端在自己机器上）</span>
          </label>
          <input
            type="text" value={localUrl}
            onChange={(e) => { setLocalUrl(e.target.value); setUseLocal(true) }}
            placeholder="http://localhost:3000"
            className="w-full h-10 px-3 ml-6 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            style={{ width: 'calc(100% - 24px)' }}
          />
        </div>

        <hr className="border-gray-100" />

        <p className="text-xs text-gray-500 leading-relaxed">
          <strong>开发模式</strong>（<code className="bg-gray-100 px-1 rounded">npm run dev</code>）：选中"本地"则绕过 Vite 代理直连本地；选中"远程"且地址留空则走 Vite 代理。<br />
          <strong>生产构建</strong>（<code className="bg-gray-100 px-1 rounded">npm run build</code>）：无论选哪个都直连对应地址，不走代理。<br />
          切换后保存即可生效，无需重启。
        </p>
      </div>
    </Modal>
  )
}

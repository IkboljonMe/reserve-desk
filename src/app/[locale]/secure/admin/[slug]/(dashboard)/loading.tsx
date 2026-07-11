import Spinner from '@/components/ui/Spinner'

export default function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
      <Spinner size={28} />
    </div>
  )
}

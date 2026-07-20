import { redirect } from 'next/navigation'

export default function CatalogRedirectPage({ searchParams }: { searchParams: any }) {
  const categoryId = searchParams?.category
  if (categoryId) {
    redirect(`/?category=${categoryId}`)
  } else {
    redirect('/')
  }
}

import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import { toast } from "sonner"

export interface ProductSize {
  id?: string
  name: string
  price: number
}

export interface Product {
  id?: string
  name: string
  description?: string
  price: number
  stock?: number
  category?: string | { id: string; name: string }
  branchId: string
  sizes?: ProductSize[]
  costPrice?: number // Adicionando o preço de custo
  createdAt?: any
  updatedAt?: any
}

class ProductService {
  async getAll(branchId: string): Promise<Product[]> {
    try {
      if (!branchId) {
        console.error("BranchId is required to get products")
        return []
      }

      console.log(`Buscando todos os produtos da filial: branches/${branchId}/products`)

      // Usar subcoleção da filial
      const productsRef = collection(db, `branches/${branchId}/products`)
      const q = query(productsRef, where("active", "!=", false), orderBy("name"))
      const querySnapshot = await getDocs(q)

      console.log(`Encontrados ${querySnapshot.size} produtos na filial ${branchId}`)

      // Se não encontrou produtos na subcoleção, tenta buscar na coleção antiga
      if (querySnapshot.empty) {
        console.log("Nenhum produto encontrado na subcoleção. Tentando buscar na coleção antiga...")
        const oldProductsRef = collection(db, "products")
        const oldQ = query(
          oldProductsRef,
          where("branchId", "==", branchId),
          where("active", "!=", false),
          orderBy("name"),
        )
        const oldQuerySnapshot = await getDocs(oldQ)

        console.log(`Encontrados ${oldQuerySnapshot.size} produtos na coleção antiga para a filial ${branchId}`)

        return oldQuerySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[]
      }

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        console.log(`Produto encontrado: ${doc.id} - ${data.name}`)
        return {
          id: doc.id,
          ...data,
          branchId, // Adicionar branchId para manter compatibilidade
        }
      }) as Product[]
    } catch (error) {
      console.error(`Erro ao buscar produtos na subcoleção branches/${branchId}/products:`, error)
      toast.error("Erro ao buscar produtos")
      return []
    }
  }

  async getById(id: string, branchId: string): Promise<Product | null> {
    try {
      if (!branchId) {
        console.error("BranchId is required to get product by ID")
        return null
      }

      // Estrutura: /branches/{branchId}/products/{productId}
      const docRef = doc(db, `branches/${branchId}/products`, id)
      const docSnap = await getDoc(docRef)

      console.log(`Buscando produto: branches/${branchId}/products/${id}`)

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          branchId, // Adicionar branchId para manter compatibilidade
        } as Product
      }

      // Se não encontrou na subcoleção, tenta buscar na coleção antiga
      const oldDocRef = doc(db, "products", id)
      const oldDocSnap = await getDoc(oldDocRef)

      if (oldDocSnap.exists() && oldDocSnap.data().branchId === branchId) {
        return {
          id: oldDocSnap.id,
          ...oldDocSnap.data(),
        } as Product
      }

      return null
    } catch (error) {
      console.error(`Erro ao buscar produto branches/${branchId}/products/${id}:`, error)
      toast.error("Erro ao buscar produto")
      return null
    }
  }

  async create(product: Product): Promise<Product> {
    try {
      if (!product.branchId) {
        throw new Error("BranchId is required to create a product")
      }

      const branchId = product.branchId

      // Remover branchId do objeto para não duplicar
      const { branchId: _, ...productData } = product

      const productToSave = {
        ...productData,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Estrutura: /branches/{branchId}/products
      console.log(`Criando produto na subcoleção: branches/${branchId}/products`)
      const docRef = await addDoc(collection(db, `branches/${branchId}/products`), productToSave)

      console.log(`Produto criado com sucesso: ${docRef.id}`)

      return {
        id: docRef.id,
        ...productToSave,
        branchId, // Adicionar branchId para manter compatibilidade
      }
    } catch (error) {
      console.error("Erro ao criar produto:", error)
      toast.error("Erro ao criar produto")
      throw error
    }
  }

  async update(id: string, product: Partial<Product>): Promise<void> {
    try {
      if (!product.branchId) {
        throw new Error("BranchId is required to update a product")
      }

      const branchId = product.branchId

      // Remover branchId do objeto para não duplicar
      const { branchId: _, ...productData } = product

      const productToUpdate = {
        ...productData,
        updatedAt: serverTimestamp(),
      }

      // Estrutura: /branches/{branchId}/products/{productId}
      console.log(`Atualizando produto: branches/${branchId}/products/${id}`)
      await updateDoc(doc(db, `branches/${branchId}/products`, id), productToUpdate)
    } catch (error) {
      console.error("Erro ao atualizar produto:", error)
      toast.error("Erro ao atualizar produto")
      throw error
    }
  }

  async delete(id: string, branchId: string): Promise<void> {
    try {
      if (!branchId) {
        throw new Error("BranchId is required to delete a product")
      }

      // Soft delete - just mark as inactive
      // Estrutura: /branches/{branchId}/products/{productId}
      console.log(`Excluindo (soft delete) produto: branches/${branchId}/products/${id}`)
      await updateDoc(doc(db, `branches/${branchId}/products`, id), {
        active: false,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Erro ao excluir produto:", error)
      toast.error("Erro ao excluir produto")
      throw error
    }
  }

  async getByCategory(category: string, branchId: string): Promise<Product[]> {
    try {
      if (!branchId) {
        console.error("BranchId is required to get products by category")
        return []
      }

      console.log(`Buscando produtos da categoria ${category} na filial ${branchId}`)

      // Estrutura: /branches/{branchId}/products
      const productsRef = collection(db, `branches/${branchId}/products`)
      const q = query(productsRef, where("category", "==", category), where("active", "!=", false), orderBy("name"))
      const querySnapshot = await getDocs(q)

      console.log(`Encontrados ${querySnapshot.size} produtos na categoria ${category} da filial ${branchId}`)

      // Se não encontrou produtos na subcoleção, tenta buscar na coleção antiga
      if (querySnapshot.empty) {
        console.log(
          `Nenhum produto encontrado na subcoleção para a categoria ${category}. Tentando buscar na coleção antiga...`,
        )
        const oldProductsRef = collection(db, "products")
        const oldQ = query(
          oldProductsRef,
          where("branchId", "==", branchId),
          where("category", "==", category),
          where("active", "!=", false),
          orderBy("name"),
        )
        const oldQuerySnapshot = await getDocs(oldQ)

        console.log(
          `Encontrados ${oldQuerySnapshot.size} produtos na coleção antiga para a categoria ${category} da filial ${branchId}`,
        )

        return oldQuerySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[]
      }

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        console.log(`Produto encontrado: ${doc.id} - ${data.name}`)
        return {
          id: doc.id,
          ...data,
          branchId, // Adicionar branchId para manter compatibilidade
        }
      }) as Product[]
    } catch (error) {
      console.error(`Erro ao buscar produtos por categoria na subcoleção branches/${branchId}/products:`, error)
      toast.error("Erro ao buscar produtos por categoria")
      return []
    }
  }

  // Método para buscar todos os produtos independentemente da categoria
  async getAllProductsForBranch(branchId: string): Promise<Product[]> {
    try {
      if (!branchId) {
        console.error("BranchId is required to get all products for branch")
        return []
      }

      console.log(`Buscando TODOS os produtos da filial ${branchId} independentemente da categoria`)

      // Primeiro, tenta buscar na subcoleção
      const productsRef = collection(db, `branches/${branchId}/products`)
      const q = query(productsRef, where("active", "!=", false), orderBy("name"))
      const querySnapshot = await getDocs(q)

      console.log(`Encontrados ${querySnapshot.size} produtos na subcoleção da filial ${branchId}`)

      const products = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          branchId,
        }
      }) as Product[]

      // Se não encontrou produtos na subcoleção, tenta buscar na coleção antiga
      if (products.length === 0) {
        console.log("Nenhum produto encontrado na subcoleção. Tentando buscar na coleção antiga...")
        const oldProductsRef = collection(db, "products")
        const oldQ = query(
          oldProductsRef,
          where("branchId", "==", branchId),
          where("active", "!=", false),
          orderBy("name"),
        )
        const oldQuerySnapshot = await getDocs(oldQ)

        console.log(`Encontrados ${oldQuerySnapshot.size} produtos na coleção antiga para a filial ${branchId}`)

        return oldQuerySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[]
      }

      return products
    } catch (error) {
      console.error(`Erro ao buscar todos os produtos da filial ${branchId}:`, error)
      toast.error("Erro ao buscar produtos")
      return []
    }
  }
}

export const productService = new ProductService()

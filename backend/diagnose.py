import sys
import os

print("=" * 70)
print("完整诊断报告")
print("=" * 70)

# 1. Python 环境
print("\n1️⃣ Python 环境:")
print(f"   Python 版本: {sys.version}")
print(f"   Python 路径: {sys.executable}")
print(f"   虚拟环境: {sys.prefix}")

# 2. JWT 包信息
print("\n2️⃣ JWT 包详细信息:")
try:
    import jwt
    print(f"   ✅ jwt 模块路径: {jwt.__file__}")
    print(f"   ✅ jwt 版本: {jwt.__version__}")
    print(f"   ✅ jwt 包名: {jwt.__package__}")
    
    # 检查包的实际安装位置
    import importlib.metadata
    try:
        dist = importlib.metadata.distribution('PyJWT')
        print(f"   ✅ PyJWT 包信息: {dist.name} {dist.version}")
        print(f"   ✅ 安装位置: {dist.locate_file('')}")
    except:
        pass
        
except ImportError as e:
    print(f"   ❌ jwt 导入失败: {e}")

# 3. exceptions 模块
print("\n3️⃣ jwt.exceptions 模块:")
try:
    import jwt.exceptions
    print(f"   ✅ 模块路径: {jwt.exceptions.__file__}")
    print(f"   ✅ 模块内容:")
    
    for name in dir(jwt.exceptions):
        if not name.startswith('_'):
            obj = getattr(jwt.exceptions, name)
            if isinstance(obj, type):
                print(f"      • {name}: {obj}")
                
except ImportError as e:
    print(f"   ❌ jwt.exceptions 导入失败: {e}")

# 4. InvalidTokenError 测试
print("\n4️⃣ InvalidTokenError 详细测试:")
try:
    from jwt.exceptions import InvalidTokenError
    print(f"   ✅ 导入成功")
    print(f"   ✅ 类型: {type(InvalidTokenError)}")
    print(f"   ✅ 模块: {InvalidTokenError.__module__}")
    print(f"   ✅ 文件: {InvalidTokenError.__module__}")
    print(f"   ✅ MRO: {[c.__name__ for c in InvalidTokenError.__mro__]}")
    
    # 实际使用测试
    try:
        jwt.decode("invalid", "secret", algorithms=["HS256"])
    except InvalidTokenError as e:
        print(f"   ✅ 异常捕获成功: {type(e).__name__}")
        
except ImportError as e:
    print(f"   ❌ InvalidTokenError 导入失败: {e}")
    print(f"   ❌ 错误详情: {type(e).__name__}: {str(e)}")

# 5. 检查是否有其他 jwt 包
print("\n5️⃣ 检查包冲突:")
import site
site_packages = site.getsitepackages()
print(f"   site-packages 路径:")
for path in site_packages:
    print(f"      • {path}")
    if os.path.exists(path):
        jwt_related = [f for f in os.listdir(path) if 'jwt' in f.lower()]
        if jwt_related:
            print(f"        JWT 相关文件/目录:")
            for item in jwt_related:
                print(f"          - {item}")

print("\n" + "=" * 70)
